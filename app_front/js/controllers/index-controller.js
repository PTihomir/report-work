(function (Ember, Alasdoo, $, undefined) {
    'use strict';

    Alasdoo.IndexController = Ember.ObjectController.extend({
        actions: {
            newreport: function () {
                this.get('model.reports').pushObject({
                    date: null,
                    hour: 8,
                    task: null
                });
            },

            sendreport: function () {
                var _this = this,
                    data = {
                        mailto: this.get('model.mailto')
                    },
                    dates = {};

                data.entries = this.get('model.reports')
                    .filter(function (element) {
                        if (!element.task) {
                            return false;
                        }
                        return true;
                    })
                    .map(function (element) {

                    var entry = {
                        date: element.date,
                        hour: parseInt(element.hour),
                        task: element.task.split(';')
                    };

                    // clear wrong task inputs
                    entry.task = $.map(entry.task, function (element) {
                        element = element.trim();
                        if (!!element) {
                            return element;
                        }
                    });

                    // if (entry.task.length === 0 || entry.task[entry.task.length - 1] === '') {
                    //     validData = false;
                    //     $element.find('.tasks').addClass('validation-error');
                    // }

                    return entry;
                });

                // check duplicate dates
                var hasDuplicates = data.entries.any(function (element) {
                    if (dates[element.date]) {
                        return true;
                    }

                    dates[element.date] = true;
                    return false;
                });

                if (hasDuplicates) {
                    this.showMessage('Duplicate date found. Check and run again.');
                    return;
                }

                if (data.entries.length === 0) {
                    this.showMessage('None of entries is correct. Check and run again.');
                    return;
                }

                this.showMessage('Sending mails...');

                $.ajax('report', {
                    type: 'POST',
                    dataType: 'json',
                    data: JSON.stringify(data)
                })
                .done(function (data) {
                    if (data.status) {
                        _this.showMessage('Sending mails OK');
                    } else {
                        _this.showMessage('Sending mails FAILED');
                    }
                })
                .fail(function () {
                    _this.showMessage('Server error...');
                });
            },

            delete: function (report) {
                this.get('model.reports').removeObject(report);
            }
        },

        clearMessage: function () {
            this.set('model.message', null);
        },

        showMessage: function (message) {
            this.set('model.message', message);
        },

        setServerResponse: function (message, error) {
            this.set('model.serverMessage', message);
            this.set('model.serverError', error);
        },

        _pingServer: function (fetchAll) {
            var _this = this;

            $.ajax('status?force=' + (fetchAll ? 'yes' : 'no') , {
                type: 'POST',
                dataType: 'json',
                cache: false,
            })
            .done(function (data) {
                if (data.status) {
                    _this.setServerResponse('Server ok\t' + moment().format('H:mm:ss'), false);
                } else {
                    _this.setServerResponse('Server in error state\t' + moment().format('H:mm:ss'), true);
                }

                if (data.rows) {
                    _this.set('model.oldReports', data.rows);
                }
            })
            .fail(function () {
                _this.setServerResponse('Server communication error\t' + moment().format('H:mm:ss'), true);
            });
        },

        _initFromServer: function () {
            var _this = this;

            $.ajax('init', {
                type: 'POST',
                dataType: 'json',
                cache: false,
            })
            .done(function (data) {
                _this.set('model.defaultMailto', data.defaultMailto);
                _this.set('model.defaultUrl', data.documentUrl);

                //window._model.reports

                if (data.lastDate) {
                    _this.set('model.initDate', moment(data.lastDate).add(1, 'days').format('dd/mm/yyyy'));
                    // _this.get('model.reports')[0].date = _this.get('model.initDate');
                }
            })
            .fail(function () {
                _this.setServerResponse('Server communication error\t' + moment().format('H:mm:ss'), true);
            });
        },

        init: function () {
            var _this = this;

            _this._initFromServer();

            setInterval(function () {
                _this._pingServer();
            }, 5000);

            _this._pingServer(true);
        }

    });

} (window.Ember, window.Alasdoo, window.jQuery));
