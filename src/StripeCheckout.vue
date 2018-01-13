<template>
    <div :id="formId">
        <input type="hidden" name="stripeToken" v-model="stripeToken">
        <input type="hidden" name="stripeEmail" v-model="stripeEmail">

        <button @click.prevent="purchase()"
                :class="btnClass"
                :disabled="!loaded">
            {{ button }}
        </button>
    </div>
</template>

<script>
    import merge from 'merge'
    import bus from './bus'
    import 'es6-promise/auto';

    export default {
        props: {
            formId: {
                type: String,
                required: false,
                default: "vue-stripe"
            },
            stripeKey: {
                type: String,
                required: true
            },
            product: {
                default: null
            },
            products: {
                type: Array
            },
            productsUrl: {
                type: String
            },
            productId: {
                required: false
            },
            button: {
                type: String,
                require: false,
                default: 'Purchase'
            },
            options: {
                type: Object,
                default: function () {
                    return {}
                }
            },
            buttonClass: { 
                type: String, 
                require: false, 
                default: 'btn btn-primary' 
            },
            onSuccess: {
                type: String,
                required: false,
                default: 'submit',
                validator: function (value) {
                    return (value === 'submit' || value === 'broadcast')
                }
            }
        },
        data() {
            return {
                stripeEmail: '',
                stripeToken: '',
                loaded: false,
            }
        },
        mounted() {
            if ((this.products || this.productsUrl) && !this.productId) {
                console.error('vue-stripe: the product-id prop is required when selling multiple products.');
                return;
            }

            this.injectCheckoutScript()
                    .then(() => this.configureStripe())
                    .catch(e => console.error(e));

            window.addEventListener('popstate', function () {
                if (typeof this.stripe !== 'undefined') {
                    this.stripe.close();
                }
            });
        },
        computed: {
            btnClass() {
                return this.buttonClass + ' btn-stripe-checkout'; 
            }
        },
        methods: {
            selectedProduct()  {
                if (this.product) {
                    return this.product;
                }

                if (this.products) {
                    let product = this.products.find(product => product.id == this.productId);

                    if (!product) return false;

                    product = merge(true, product);

                    delete product.id;

                    return product;
                } else if (this.productsUrl && this.productId) {
                    return this.$http.get(this.productsUrl, {params: {productId: this.productId}})
                            .catch(e => bus.$emit('vue-stripe.error', e));
                }

                return false;
            },

            injectCheckoutScript() {
                let self = this;
                let el = document.createElement('SCRIPT');
                let ctr = 0;
                let scriptSource = 'https://checkout.stripe.com/checkout.js';
                let scripts = document.getElementsByTagName('script');
                let scriptExists = false;

                for (var i in scripts){
                    if (scripts[i].src == scriptSource) {
                        scriptExists = true;
                    }
                }

                el.setAttribute('src', scriptSource);

                if(!scriptExists) {
                    document.querySelector("#"+this.formId).appendChild(el);
                }

                return new Promise((resolve, reject) => {
                    let handle = window.setInterval(function () {
                        if (window.StripeCheckout) {
                            self.loaded = true;
                            resolve();
                            clearInterval(handle)
                        }

                        ctr++;

                        if (ctr > 1000) {
                            reject("vue-stripe: Unable to load checkout.js");
                            clearInterval(handle);
                        }
                    }, 5);
                });
            },

            configureStripe: function () {
                let self = this;

                let options = merge.recursive(true, {
                    key: self.stripeKey,
                    image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
                    token: function (token) {
                        self.stripeToken = token.id;
                        self.stripeEmail = token.email;

                        self.$nextTick(function () {
                            if (self.onSuccess === 'broadcast') {
                                bus.$emit('vue-stripe.success', {
                                    token: self.stripeToken,
                                    email: self.stripeEmail,
                                    formId: this.formId
                                });
                            } else {
                                document.querySelector('#'+this.formId).parentElement.submit();
                            }
                        });
                    }
                }, this.options);

                this.stripe = StripeCheckout.configure(options)
            },

            purchase() {
                let product = this.selectedProduct();

                if (typeof product == 'object' && product.hasOwnProperty('promise')) {
                    product.then(function (data) {
                        product = data.data;
                        this.stripe.open(product);
                    })
                } else if (product) {
                    this.stripe.open(product);
                } else {
                    bus.$emit('vue-stripe.not-found');
                }
            }
        }
    }
</script>
