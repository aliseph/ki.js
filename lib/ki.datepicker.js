(function($) {
    "use strict";
    var Util = {
        isLeapYear: function(year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
        },
        getDaysInMonth: function(year, month) {
            return [31, (Util.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        parseFormat: function(format) {
            var separator = format.match(/[.\/-].*?/),
                    parts = format.split(/\W+/);
            if (!separator || !parts || parts.length === 0) {
                throw new Error("Invalid date format.");
            }
            return {separator: separator, parts: parts};
        },
        parseDate: function(date, format) {
            var today = new Date();
            if (!date)
                date = "";
            var parts = date.split(format.separator),
                    date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
                    val;
            if (parts.length === format.parts.length) {
                for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10) || 1;
                    switch (format.parts[i]) {
                        case 'dd':
                        case 'd':
                            date.setDate(val);
                            break;
                        case 'mm':
                        case 'm':
                            date.setMonth(val - 1);
                            break;
                        case 'yy':
                            date.setFullYear(2000 + val);
                            break;
                        case 'yyyy':
                            date.setFullYear(val);
                            break;
                    }
                }
            }
            return date;
        },
        formatDate: function(date, format) {
            var val = {
                d: date.getDate(),
                m: date.getMonth() + 1,
                yy: date.getFullYear().toString().substring(2),
                yyyy: date.getFullYear()
            };
            val.dd = (val.d < 10 ? '0' : '') + val.d;
            val.mm = (val.m < 10 ? '0' : '') + val.m;
            var date = [];
            for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
                date.push(val[format.parts[i]]);
            }
            return date.join(format.separator);
        }
    };

    $.fn.datepicker = function(opts) {
        return this.each(function() {
            var $this = $(this);
            if (!$this.data('datepicker')) {
                $this.data('datepicker', (new $.datepicker(this, $.extend({}, $.datepicker.opts, opts))));
            }
            return this;
        });
    };
    $.datepicker = function(element, opts) {
        this.element = $(element);
        this.format = Util.parseFormat(opts.format || this.element.data('date-format'));
        this.picker = $(this.template()).appendTo('body').hide().on('mousedown.datepicker', $.proxy(this.mousedown, this)).on('click.datepicker', $.proxy(this.click, this));
        this.bindEl = opts.bindEl || this.element;
        this.element.attr('autoComplete', 'Off').on({
            "focus.datepicker": $.proxy(this.show, this),
            "click.datepicker": $.proxy(this.show, this),
            "blur.datepicker": $.proxy(this.blur, this),
            "keyup.datepicker": $.proxy(this.update, this),
            "keydown.datepicker": $.proxy(this.keydown, this)
        });
        this.viewMode = opts.viewMode;
        this.startViewMode = opts.viewMode;
        this.minViewMode = opts.minViewMode;

        this.fillDow();
        this.fillMonths();
        this.update();
        this.showMode();
    };
    $.datepicker.opts = {
        format: 'yyyy-mm-dd', //the date format, combination of d, dd, m, mm, yy, yyy
        viewMode: 0, //set the start view mode. Accepts: 'days', 'months', 'years', 0 for days, 1 for months and 2 for years
        minViewMode: 0, //set the mini view mode. Accepts: 'days', 'months', 'years', 0 for days, 1 for months and 2 for years
        bindEl: undefined
    };
    $.datepicker.setting = {
        modes: [{
                clsName: 'days',
                navFnc: 'Month',
                navStep: 1
            }, {
                clsName: 'months',
                navFnc: 'FullYear',
                navStep: 1
            }, {
                clsName: 'years',
                navFnc: 'FullYear',
                navStep: 10
            }],
        dates: {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        }
    };
    $.datepicker.prototype = {
        template: function() {
            var head = '<thead><tr><th class="prev"><i class="uk-icon-arrow-left"/></th>' +
                    '<th colspan="5" class="switch"></th>' +
                    '<th class="next"><i class="uk-icon-arrow-right"/></th></tr></thead>',
                    cont = '<tbody><tr><td colspan="7"></td></tr></tbody>',
                    template = '<div class="datepicker uk-dropdown">' +
                    '<div class="datepicker-days">' +
                    '<table class="uk-table-condensed">' +
                    head +
                    '<tbody></tbody></table></div>' +
                    '<div class="datepicker-months">' +
                    '<table class="uk-table-condensed">' +
                    head +
                    cont +
                    '</table></div>' +
                    '<div class="datepicker-years">' +
                    '<table class="uk-table-condensed">' +
                    head +
                    cont +
                    '</table></div></div>';
            return template;
        },
        show: function(e) {
            $('div.datepicker.uk-dropdown').hide(); //make sure to hide all other calendars
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.place();
            $(window).on('resize.datepicker', $.proxy(this.place, this));
            $('body').on('click.datepicker', $.proxy(this.hide, this));
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            this.element.trigger({
                type: 'show',
                date: this.date
            });
            // make sure we see the datepicker
        },
        setValue: function() {
            var formated = Util.formatDate(this.date, this.format);
            this.element.prop('value', formated);
        },
        place: function() {
            var offset = this.component ? this.component.offset() : this.element.offset();
            this.picker.css({
                top: offset.top + this.height,
                left: offset.left
            });
        },
        update: function() {
            var date = this.element.val();
            this.date = Util.parseDate(
                    date ? date : this.element.data('date'),
                    this.format
                    );
            this.viewDate = new Date(this.date);
            this.fill();
        },
        fillMonths: function() {
            var html = '';
            var i = 0;
            while (i < 12) {
                html += '<span class="month">' + $.datepicker.setting.dates.monthsShort[i++] + '</span>';
            }
            this.picker.find('.datepicker-months td').append(html);
        },
        fillDow: function() {
            var dowCnt = 0;
            var html = '<tr>';
            while (dowCnt < 7) {
                html += '<th class="dow">' + $.datepicker.setting.dates.daysMin[(dowCnt++) % 7] + '</th>';
            }
            html += '</tr>';
            this.picker.find('.datepicker-days thead').append(html);
        },
        fill: function() {
            var d = new Date(this.viewDate),
                    year = d.getFullYear(),
                    month = d.getMonth(),
                    currentDate = this.date.valueOf();
            this.picker.find('.datepicker-days th:eq(1)')
                    .text($.datepicker.setting.dates.months[month] + ' ' + year);
            var prevMonth = new Date(year, month - 1, 28, 0, 0, 0, 0),
                    day = Util.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
            prevMonth.setDate(day);
            prevMonth.setDate(day - (prevMonth.getDay() + 7) % 7);
            var nextMonth = new Date(prevMonth);
            nextMonth.setDate(nextMonth.getDate() + 42);
            nextMonth = nextMonth.valueOf();
            var html = [];
            var clsName;
            while (prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getDay() === 0) {
                    html.push('<tr>');
                }
                clsName = '';
                if (prevMonth.getMonth() < month) {
                    clsName += ' old';
                } else if (prevMonth.getMonth() > month) {
                    clsName += ' new';
                }
                if (prevMonth.valueOf() === currentDate) {
                    clsName += ' active';
                }
                html.push('<td class="day' + clsName + '">' + prevMonth.getDate() + '</td>');
                if (prevMonth.getDay() === this.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setDate(prevMonth.getDate() + 1);
            }
            this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
            var currentYear = this.date.getFullYear();
            var months = this.picker.find('.datepicker-months')
                    .find('th:eq(1)')
                    .text(year)
                    .end()
                    .find('span').removeClass('active');
            if (currentYear === year) {
                months.eq(this.date.getMonth()).addClass('active');
            }

            html = '';
            year = parseInt(year / 10, 10) * 10;
            var yearCont = this.picker.find('.datepicker-years')
                    .find('th:eq(1)')
                    .text(year + '-' + (year + 9))
                    .end()
                    .find('td');
            year -= 1;
            for (var i = -1; i < 11; i++) {
                html += '<span class="year' + (i === -1 || i === 10 ? ' old' : '') + (currentYear === year ? ' active' : '') + '">' + year + '</span>';
                year += 1;
            }
            yearCont.html(html);
        },
        blur: function(e) {
        },
        hide: function(e) {
            this.picker.hide();
            $(window).off('resize.datepicker', this.place);
            this.viewMode = this.startViewMode;
            this.showMode();
            $('body').off('click.datepicker', $.proxy(this.click, this));
        },
        click: function(e) {
            e.stopPropagation();
            e.preventDefault();
        },
        mousedown: function(e) {
            e.stopPropagation();
            e.preventDefault();
            var target = $(e.target).closest('span, td, th'), setting = $.datepicker.setting;
            if (target.length === 1) {
                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'switch':
                                this.showMode(1);
                                break;
                            case 'prev':
                            case 'next':
                                this.viewDate['set' + setting.modes[this.viewMode].navFnc].call(
                                        this.viewDate,
                                        this.viewDate['get' + setting.modes[this.viewMode].navFnc].call(this.viewDate) +
                                        setting.modes[this.viewMode].navStep * (target[0].className === 'prev' ? -1 : 1)
                                        );
                                this.fill();
                                break;
                        }
                        break;
                    case 'span':
                        if (target.is('.month')) {
                            var month = target.parent().find('span').index(target);
                            this.viewDate.setMonth(month);
                        } else {
                            var year = parseInt(target.text(), 10) || 0;
                            this.viewDate.setFullYear(year);
                        }
                        if (this.viewMode === this.minViewMode) {
                            this.date = new Date(this.viewDate);
                            this.element.trigger({
                                type: 'changeDate',
                                date: this.date,
                                viewMode: setting.modes[this.viewMode].clsName
                            });
                            this.fill();
                            this.setValue();
                            this.hide();
                        }
                        this.showMode(-1);
                        this.fill();
                        break;
                    case 'td':
                        if (target.is('.day')) {
                            var day = parseInt(target.text(), 10) || 1;
                            var month = this.viewDate.getMonth();
                            if (target.is('.old')) {
                                month -= 1;
                            } else if (target.is('.new')) {
                                month += 1;
                            }
                            var year = this.viewDate.getFullYear();
                            this.date = new Date(year, month, day, 0, 0, 0, 0);
                            this.viewDate = new Date(year, month, day, 0, 0, 0, 0);
                            this.fill();
                            this.setValue();
                            this.element.trigger({
                                type: 'changeDate',
                                date: this.date
                            });
                            this.hide();
                        }
                        break;
                }
            }
        },
        keydown: function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode === 9)
                this.hide(); // when hiting TAB, for accessibility
        },
        showMode: function(dir) {
            if (dir) {
                this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
            }
            this.picker.find('>div').hide().filter('.datepicker-' + $.datepicker.setting.modes[this.viewMode].clsName).show();
        },
        destroy: function() {
            this.element.removeData("datepicker").off(".datepicker");
            this.picker.remove();
        }
    };
})(jQuery);