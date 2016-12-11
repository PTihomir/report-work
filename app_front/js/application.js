(function (Ember, undefined) {
    'use strict';

    var Alasdoo = window.Alasdoo = Ember.Application.create({
        LOG_TRANSITIONS: true,
        LOG_TRANSITIONS_INTERNAL: false,
        LOG_VIEW_LOOKUPS: false,
        LOG_ACTIVE_GENERATION: true,
        LOG_RESOLVER: false

    });

    Alasdoo.ApplicationRoute = Ember.Route.extend({

        // actions: {
        //     login: function() {
        //         this.get('auth').login();
        //     },

        //     logout: function() {
        //         this.get('auth').logout();
        //     }
        // },

        setupController: function(/*controller*/) {
            // `controller` is the instance of ApplicationController
            // controller.set('title', 'Hello world!');
        }
    });

    Alasdoo.ApplicationController = Ember.Controller.extend({

    });

    var lastEntry;

    Alasdoo.DateField = Ember.TextField.extend({
        type: 'text',
        // date: function(key, date) {
        //     if (date) {
        //         this.set('value', date.toISOString().substring(0, 10));
        //     } else {
        //         var value = this.get('value');
        //         if (value) {
        //             date = new Date(value);
        //         } else {
        //             date = null;
        //         }
        //     }
        //     return date;
        // }.property('value'),

        didInsertElement: function () {
            var date = new Date();

            if (lastEntry) {
              date = moment(lastEntry.val(), 'DD/MM/YYYY').add(1, 'd').toDate();
            }

            console.log(date);

            this.$().datepicker({
                format: 'dd/mm/yyyy',
                weekStart: 1
            })
            .datepicker('setDate', date);

            lastEntry = this.$();
        },

        initWidget: function () {

        }.on('didInsertElement'),

    });

}(window.Ember));