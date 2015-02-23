(function (Ember, Alasdoo, undefined) {
    'use strict';
    // App route
    Alasdoo.Router.map(function() {

    });

    Alasdoo.IndexRoute = Ember.Route.extend({
        setupController: function(controller, model) {
            this._super(controller, model);
        },

        model: function () {
            window._model = {
                message: null,
                defaultMailto: 'report@wedoqa.com',
                reports: [{
                    date: null,
                    hour: 8,
                    task: null
                }]
            };

            return window._model;
        },

        init: function () {

        }
    });



} (window.Ember, window.Alasdoo));
