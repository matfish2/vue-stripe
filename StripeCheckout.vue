<template>
    <div id="vue-stripe">
        <input type="hidden" name="stripeToken" v-model="stripeToken">
        <input type="hidden" name="stripeEmail" v-model="stripeEmail">

        <button @click.prevent='purchase()'
        class='btn btn-primary btn-stripe-checkout'
        :disabled="!loaded"
        >{{button}}
    </button>

</div>
</template>

<script>

    import Vue from 'vue'
    import merge from 'merge'
    require('es6-promise/auto');
    import bus from './bus'

    export default {
        props: {
            stripeKey:{
                type: String,
                required: true
            },
            product:{
                default:null
            },
            products: {
                type: Array
            },
            productsUrl: {
                type: String
            },
            productId:{
                required:false
            },
            button:{
                type: String,
                require:false,
                default:'Purchase'
            },
            options:{
                type: Object,
                default: function() {
                    return {}
                }
            },
            onSuccess:{
                type: String,
                required: true,
                validator: function (value) {
                    return (value === 'submit' || value === 'broadcast')
                }
            }
        },
        data() {
            return  {
                stripeEmail:'',
                stripeToken:'',
                loaded:false,
            }
        },
        mounted() {

            if ((this.products || this.productsUrl) && !this.productId) {
                console.error('vue-stripe: the product-id prop is required when selling multiple products.');
                return;
            }

            this.injectCheckoutScript().then(() => {
                this.configureStripe();
            }).catch((e)=>console.error(e));

            window.addEventListener('popstate', function() {
                this.stripe.close();
            });
        },

        methods:{
           selectedProduct()  {

            if (this.product)
                return this.product;

            if (this.products) {

                let product = this.products.find(product => product.id == this.productId);

                if (!product) return false;

                product = merge(true, product);

                delete product.id;

                return product;
            } else if (this.productsUrl && this.productId) {
              return this.$http.get(this.productsUrl,{params:{productId:this.productId}}).catch(function(e) {
                bus.$emit('vue-stripe.error', e)
            });
          }

          return false;

      },
      injectCheckoutScript() {

        let el = document.createElement('SCRIPT');
        let ctr = 0;

        el.setAttribute('src','https://checkout.stripe.com/checkout.js');
        document.querySelector("#vue-stripe").appendChild(el);

        let promise = new Promise(function(resolve, reject) {

            let handle = window.setInterval(function() {

                if (window.StripeCheckout) {
                    this.loaded = true;
                    resolve();
                    clearInterval(handle)
                };

                ctr++;

                if (ctr>1000)  {
                    reject("vue-stripe: Unable to load checkout.js");
                    clearInterval(handle);
                }
            }.bind(this), 5);

        }.bind(this));

        return promise;
    },
    configureStripe: function() {

        let self = this;

        let options = merge.recursive(true, {
            key: self.stripeKey,
            image:'https://stripe.com/img/documentation/checkout/marketplace.png',
            token: function(token) {

                self.stripeToken = token.id;
                self.stripeEmail = token.email;

                Vue.nextTick(function() {
                    if(self.onSuccess === 'broadcast') {
                        bus.$emit('vue-stripe.success', {
                            token: self.stripeToken,
                            email: self.stripeEmail
                        });
                    } else {
                        document.querySelector('#vue-stripe').parentElement.submit();
                    }
               })

            }
        }, this.options);

        this.stripe = StripeCheckout.configure(options)

    },
    purchase() {
     let product = this.selectedProduct();

     if (typeof product=='object' && product.hasOwnProperty('promise')) {
        product.then(function(data) {
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
