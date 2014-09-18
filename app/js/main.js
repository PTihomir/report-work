/* global $ */
$(document).ready(function () {
    'use strict';
    // variables
    var entryTemplate;


    // methods
    var setup = function () {

        entryTemplate = $('.entry').detach();

        addEntry();

        bindEvents();

        setInterval(checkServer, 5000);
    },

    addEntry = function () {

        var newEntry = entryTemplate
            .clone()
            .insertBefore($('.new-entry'));

        newEntry.find('.date')
            .on('click', function (e) {
                e.preventDefault();
            })
            .datepicker({
                format: 'dd/mm/yyyy',
                weekStart: 1
            })
            .datepicker('setValue', new Date());

        newEntry.find('.hour').val(8);

    },

    bindEvents = function () {

        $('.message').on('click', function (e) {
            clearMessage();
        });
        $('.start').on('click', function (e) {
            e.preventDefault();

            if ($('.entries .validation-error').length) {
                showMessage('Fix all warning inputs');
            } else {
                sendData();
            }
        });

        $('.new-entry').on('click', function (e) {
            e.preventDefault();
            addEntry();
        });

        $('.entries').on('click', '.delete-entry', function (e) {
            e.preventDefault();
            $(this).closest('.entry').remove();
        })
        .on('change, keyup', '.validation-error', function () {
            $(this).removeClass('validation-error');
        });

    },

    sendData = function () {
        var mailto = $('.email').val(),
            data = {
                mailto: mailto
            },
            dateCache = {},
            validData = true;

        data.entries = $('.entries').find('.entry').map(function (index, element) {
            var $element = $(element),
                entry = {
                    date: $element.find('.date').val(),
                    hour: $element.find('.hour').val(),
                    task: $element.find('.tasks').val().split(';')
                };

            entry.task = $.map(entry.task, function (element) {
                element = element.trim();
                if (!!element) {
                    return element;
                }
            });

            if (dateCache[entry.date]) {
                validData = false;
                dateCache[entry.date].find('.date').addClass('validation-error');
                $element.find('.date').addClass('validation-error');
            }

            if (entry.task.length === 0 || entry.task[entry.task.length - 1] === '') {
                validData = false;
                $element.find('.tasks').addClass('validation-error');
            }

            return entry;
        }).get();

        // check if data is valid

        if (!validData) {
            showMessage('Wrong inputs');
            return;
        }

        showMessage('Sending mails...');

        $.ajax('report', {
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data)
        })
        .done(function (data) {
            if (data.status) {
                showMessage('Sending mails OK');
            } else {
                showMessage('Sending mails FAILED');
            }
        })
        .fail(function () {
            showMessage('Server error...');
        });
    },

    clearMessage = function () {
        $('.message').hide();
    },

    showMessage = function (message) {
        $('.message').text(message).show();
    },

    checkServer = function () {
        $.ajax('status', {
            type: 'POST',
            dataType: 'json',
            cache: false,
        })
        .done(function (data) {
            if (data.status) {
                $('.server-status')
                    .addClass('ok')
                    .removeClass('error')
                    .text('Server ok\t' + moment().format('H:mm:ss'));
            } else {
                $('.server-status')
                    .addClass('error')
                    .removeClass('ok')
                    .text('Server in error state\t' + moment().format('H:mm:ss'));
            }

            if (data.rows) {

            }
        })
        .fail(function () {
            $('.server-status')
                .addClass('error')
                .removeClass('ok')
                .text('Server error\t' + moment().format('H:mm:ss'));
        });
    };


    setup();


});
