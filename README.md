# Vue Stripe

This package provides a convenient wrapper around Stripe's [checkout component](https://stripe.com/checkout) for vue.js 2

## Installation

```js
npm install vue-stripe
```

Require the script:

```js
import { StripeCheckout } from 'vue-stripe'
```

Register the component:

```js
Vue.component('stripe-checkout', StripeCheckout);
```

--- or ----

```js
new Vue({
    components: {
        'stripe-checkout': StripeCheckout
    }
});
```

## Usage

Embed the component in your form as a direct HTML child.

If you are selling a single product this will do:

```html
<form action="/process-payment" method="POST">
    <stripe-checkout
        stripe-key="my-stripe-key"
        product="product">
    </stripe-checkout>
</form>
```

The `product` object should match at least the bare minimum required by Stripe. E.g:

```js
{
    name: 'Moby Dick',
    description: 'I love whales',
    amount: 100000 // 100$ in cents
}
```

Additional props:

*  `options` Additional options to be merged into the main configuration object (e.g `zipCode:true`)
*  `button` Button text. Default: 'Purchase'
*  `formId` Set the id for the div containing the form, allows for multiple components per page
* `button-class` HTML `class` attribute for the button. Default: `btn btn-primary`
*  `on-success` How to proceed once the checkout form was submitted.
Defaults to `submit`, which submits the main form. Set to `broadcast` to handle submission by yourself.

When selling multiple products you can either pass them all to the client (Option A) or, if you are dealing with an espescially large number of products, get the relevant product via ajax (Option B. Requires `vue-resource`>=0.9.0).

Both options require a `product-id` prop, which references the current product id on your instance.
This would normally be a value from a select box or a router param.

Option A:

```html
<form action="/process-payment" method="POST">
    <select v-model="productId">
        <option value="1">Product A</option>
        <option value="2">Product B</option>
        <option value="3">Product C</option>
    </select>

    <stripe-checkout
        stripe-key="my-stripe-key"
        :products="products"
        :product-id="productId">
    </stripe-checkout>
</form>
```

```js
{
    data: {
        products:[
            {
                id:1,
                name:'Product A',
                description:'Product A Description',
                amount:100000
            },
            {
                id:2,
                name:'Product B',
                description:'Product B Description',
                amount:50000
            },
            {
                id:3,
                name:'Product C',
                description:'Product C Description',
                amount:60000
            }
        ]
    }
}
```

Option B:

```html
<form action="/process-payment" method="POST">
    <select v-model="productId">
        <option value="1">Product A</option>
        <option value="2">Product B</option>
        <option value="3">Product C</option>
    </select>

    <stripe-checkout
        stripe-key="my-stripe-key"
        products-url="/products"
        :productId="productId">
    </stripe-checkout>
</form>
```

Server side Example (Laravel)

```php
Route::get('products', function() {
    $productId = request('productId');

    return Product::find($productId);
});
```

Once the checkout form was submitted the main form will be automatically submitted.
The request will include the `stripeEmail` and `stripeToken` parameters, which will enable you to process the payment and redirect back.
If you wish to handle submission by yourself set the `on-success` prop to `broadcast`.

## Events

Listen to events using the event bus:

```js
import { Bus } from 'vue-stripe';

Bus.$on('vue-stripe.success', payload => {
    //
});
```

* `vue-stripe.not-found` Fires off when the selected product was not found
* `vue-stripe.error` Fires off when an invalid response was returned from the server using the `products-url` prop
* `vue-stripe.success` Fires off if `on-success` is set to `broadcast`. Sends through the email and the token.

## Development

To build the project:

```
npm run build
```
