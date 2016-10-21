import StripeCheckout from './StripeCheckout.vue'

exports.install = function(Vue) {
  Vue.component('stripe-checkout', StripeCheckout);
}
