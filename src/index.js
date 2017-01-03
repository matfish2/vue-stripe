import Vue from 'vue';
import StripeCheckout from './StripeCheckout.vue';

exports.install = Vue => {
    Vue.component('stripe-checkout', StripeCheckout);
}
