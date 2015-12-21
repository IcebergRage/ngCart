'use strict';


angular.module('ngCart', ['ngCart.directives'])

    .config([function () {

    }])

    .provider('$ngCart', function () {
        this.$get = function () {
        };
    })

    .run(['$rootScope', 'ngCart','ngCartItem', 'store', function ($rootScope, ngCart, ngCartItem, store) {

        $rootScope.$on('ngCart:change', function(){
            ngCart.$save();
        });

        if (angular.isObject(store.get('cart'))) {
            ngCart.$restore(store.get('cart'));

        } else {
            ngCart.init();
        }

    }])

    .service('ngCart', ['$rootScope', 'ngCartItem', 'store', function ($rootScope, ngCartItem, store) {

        this.init = function() {
            this.$cart = {
                plan : null,
                shipping : null,
                shippingInformations : {
                    firstName : null,
                    lastName : null,
                    address : null
                },
                taxRate : 20,
                tax : null,
                items : []
            };
        };

        this.addItem = function (id, name, price, quantity, data) {

            var inCart = this.getItemById(id);
            var discover = function(newItem) {
                this.$cart.items.push(newItem);
            };
            var gallery = function(newItem) {

            };

            if (typeof inCart === 'object'){
                //Update quantity of an item if it's already in the cart
                inCart.setQuantity(quantity, false);
                $rootScope.$broadcast('ngCart:itemUpdated', inCart);
            } else {
                var length = this.$cart.items.length;
                var plan = this.$cart.plan;

                if ((plan === 'discover' && length < 5) ||
                    (plan === 'gallery' && length < 10)) {
                    var newItem = new ngCartItem(id, name, price, quantity, data);
                    this.$cart.items.push(newItem);
                    $rootScope.$broadcast('ngCart:itemAdded', newItem);
                    $rootScope.$broadcast('ngCart:change', {});
                }

                if (plan === 'discover' && length > 5) {
                    this.empty();
                }
            }

        };

        this.getItemById = function (itemId) {
            var items = this.getCart().items;
            var build = false;

            angular.forEach(items, function (item) {
                if  (item.getId() === itemId) {
                    build = item;
                }
            });
            return build;
        };

        this.setShipping = function(shipping){
            this.$cart.shipping = shipping;
            return this.getShipping();
        };

        this.getShipping = function(){
            if (this.getCart().items.length == 0) return 0;
            return  this.getCart().shipping;
        };

        this.setTaxRate = function(taxRate){
            this.$cart.taxRate = +parseFloat(taxRate).toFixed(2);
            return this.getTaxRate();
        };

        this.getTaxRate = function(){
            return this.$cart.taxRate;
        };

        this.getTax = function(){
            return +parseFloat(((this.getSubTotal()/100) * this.getCart().taxRate )).toFixed(2);
        };

        this.setShippingFirstName = function(firstName) {
            this.$cart.shippingInformations.firstName = firstName;
            return this.getShippingFirstName();
        };

        this.getShippingFirstName = function() {
            return this.$cart.shippingInformations.firstName;
        };

        this.setShippingLastName = function(lastName) {
            this.$cart.shippingInformations.lastName = lastName;
            return this.getShippingLastName();
        };

        this.getShippingLastName = function() {
            return this.$cart.shippingInformations.lastName;
        };

        this.setShippingAddress = function(address) {
            this.$cart.shippingInformations.address = address;
            return this.getShippingAddress();
        };

        this.getShippingAddress = function() {
            return this.$cart.shippingInformations.address;
        };

        this.setPlan = function(plan) {
            this.$cart.plan = plan;
            return this.getPlan();
        };

        this.getPlan = function() {
            return this.$cart.plan;
        };

        this.setCart = function (cart) {
            this.$cart = cart;
            return this.getCart();
        };

        this.getCart = function(){
            return this.$cart;
        };

        this.getItems = function(){
            return this.getCart().items;
        };

        this.getTotalItems = function () {
            var count = 0;
            var items = this.getItems();
            angular.forEach(items, function (item) {
                count += item.getQuantity();
            });
            return count;
        };

        this.getTotalUniqueItems = function () {
            return this.getCart().items.length;
        };

        this.getSubTotal = function(){
            var total = 0;

            if (this.plan && this.plan === 'discover') total = 300;
            else if (this.plan && this.plan === 'gallery') total = 550;
            return +parseFloat(total).toFixed(2);
        };

        this.totalCost = function () {
            return +parseFloat(this.getSubTotal() + this.getShipping() + this.getTax()).toFixed(2);
        };

        this.removeItem = function (index) {
            var item = this.$cart.items.splice(index, 1)[0] || {};
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change', {});

        };

        this.removeItemById = function (id) {
            var item;
            var cart = this.getCart();
            angular.forEach(cart.items, function (item, index) {
                if(item.getId() === id) {
                    item = cart.items.splice(index, 1)[0] || {};
                }
            });
            this.setCart(cart);
            $rootScope.$broadcast('ngCart:itemRemoved', item);
            $rootScope.$broadcast('ngCart:change', {});
        };

        this.empty = function () {

            $rootScope.$broadcast('ngCart:change', {});
            this.$cart.items = [];
            this.$cart.plan = null;
            this.$cart.priceRate = null;
            this.$cart.shipping = null;
            this.$cart.shippingInformations.firstName = null;
            this.$cart.shippingInformations.lastName = null;
            this.$cart.shippingInformations.address = null;
            this.$cart.taxRate = null;
            this.$cart.tax = null;
            localStorage.removeItem('cart');
        };

        this.isEmpty = function () {

            return (this.$cart.items.length > 0 ? false : true);

        };

        this.toObject = function() {

            if (this.getItems().length === 0) return false;

            var items = [];
            angular.forEach(this.getItems(), function(item){
                items.push (item.toObject());
            });

            return {
                plan: this.getPlan(),
                priceRate: this.getPriceRate(),
                shipping: this.getShipping(),
                shippingInformations: {
                    firstName: this.getShippingFirstName(),
                    lastName: this.getShippingLastName(),
                    address: this.getShippingAddress(),
                },
                tax: this.getTax(),
                taxRate: this.getTaxRate(),
                subTotal: this.getSubTotal(),
                totalCost: this.totalCost(),
                items:items
            };
        };


        this.$restore = function(storedCart){
            var _self = this;
            _self.init();
            _self.$cart.priceRate = storedCart.priceRate;
            _self.$cart.shipping = storedCart.shipping;
            _self.$cart.tax = storedCart.tax;
            _self.$cart.shippingInformations.firstName = storedCart.shippingInformations.firstName;
            _self.$cart.shippingInformations.lastName = storedCart.shippingInformations.lastName;
            _self.$cart.shippingInformations.address = storedCart.shippingInformations.address;
            _self.$cart.plan = storedCart.plan;

            angular.forEach(storedCart.items, function (item) {
                _self.$cart.items.push(new ngCartItem(item._id,  item._name, item._price, item._quantity, item._data));
            });
            this.$save();
        };

        this.$save = function () {
            return store.set('cart', JSON.stringify(this.getCart()));
        };

    }])

    .factory('ngCartItem', ['$rootScope', '$log', function ($rootScope, $log) {

        var item = function (id, name, price, quantity, data) {
            this.setId(id);
            this.setName(name);
            this.setPrice(price);
            this.setQuantity(quantity);
            this.setData(data);
        };


        item.prototype.setId = function(id){
            if (id)  this._id = id;
            else {
                $log.error('An ID must be provided');
            }
        };

        item.prototype.getId = function(){
            return this._id;
        };


        item.prototype.setName = function(name){
            if (name)  this._name = name;
            else {
                $log.error('A name must be provided');
            }
        };
        item.prototype.getName = function(){
            return this._name;
        };

        item.prototype.setPrice = function(price){
            var priceFloat = parseFloat(price);
            if (priceFloat) {
                if (priceFloat <= 0) {
                    $log.error('A price must be over 0');
                } else {
                    this._price = (priceFloat);
                }
            } else {
                $log.error('A price must be provided');
            }
        };
        item.prototype.getPrice = function(){
            return this._price;
        };


        item.prototype.setQuantity = function(quantity, relative){

            var quantityInt = parseInt(quantity);
            if (quantityInt % 1 === 0){
                if (relative === true){
                    this._quantity  += quantityInt;
                } else {
                    this._quantity = quantityInt;
                }
                if (this._quantity < 1) this._quantity = 1;

            } else {
                this._quantity = 1;
                $log.info('Quantity must be an integer and was defaulted to 1');
            }
        };

        item.prototype.getQuantity = function(){
            return this._quantity;
        };

        item.prototype.setData = function(data){
            if (data) this._data = data;
        };

        item.prototype.getData = function(){
            if (this._data) return this._data;
            else $log.info('This item has no data');
        };

        item.prototype.getTotal = function(){
            return +parseFloat(this.getQuantity() * this.getPrice()).toFixed(2);
        };

        item.prototype.toObject = function() {
            return {
                id: this.getId(),
                name: this.getName(),
                price: this.getPrice(),
                quantity: this.getQuantity(),
                data: this.getData(),
                total: this.getTotal()
            };
        };

        return item;

    }])

    .service('store', ['$window', function ($window) {

        return {

            get: function (key) {
                if ($window.localStorage [key]) {
                    var cart = angular.fromJson($window.localStorage [key]);
                    return JSON.parse(cart);
                }
                return false;
            },


            set: function (key, val) {
                if (val === undefined) {
                    $window.localStorage .removeItem(key);
                } else {
                    $window.localStorage [key] = angular.toJson(val);
                }
                return $window.localStorage [key];
            }
        };
    }])

    .controller('CartController',['$scope', 'ngCart', function($scope, ngCart) {
        $scope.ngCart = ngCart;

    }])

    .value('version', '1.0.0');
