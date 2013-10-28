(function($) {
    "use strict";
    //require ki.core.js
    $._cover = {
        default: {
            clsCover: "ki-cover",
            clsCoverShow: "ki-cover ki-cover-showing",
            clsCoverHide: "ki-cover ki-cover-hidden",
            el: undefined
        },
        show: function() {
            this.init();
            this.default.el = $("." + this.default.clsCover);
            this.default.el.attr('class', this.default.clsCoverShow);
        },
        hide: function() {
            this.default.el.remove();
        },
        init: function() {
            if (!$('.' + $._cover.default.clsCover).length > 0) {
                $('body').append('<div class="' + $._cover.default.clsCoverHide + '"></div>');
            }
        }
    };
    $._loading = {
        start: function() {
            $._cover.show();
            $('body').append('<div class="loading"><i class="uk-icon-refresh uk-icon-spin uk-icon-large"></i></div>');
        },
        over: function() {
            $._cover.hide();
            $('body').children(".loading").remove();
        }
    };

    $._dialog = {
        labels: {
            ok: "OK",
            cancel: "Cancel",
            delete: "Delete"
        },
        opts: {},
        default: {
            el: undefined,
            elCallee: undefined,
            controls: {},
            tpl: {
                buttons: {
                    holder: "<nav class=\"ki-buttons\">{{buttons}}</nav>",
                    submit: "<button role=\"button\" type=\"submit\" class=\"ki-button uk-button uk-button-primary\" id=\"ki-ok\">{{ok}}</button>",
                    ok: "<button role=\"button\" type=\"button\" class=\"ki-button uk-button uk-button-primary\" id=\"ki-ok\">{{ok}}</button>",
                    cancel: "<button role=\"button\" type=\"button\" class=\"ki-button uk-button\" id=\"ki-cancel\">{{cancel}}</button>",
                    delete: "<button role=\"button\" type=\"button\" class=\"ki-button uk-button uk-button-danger\" id=\"ki-delete\">{{delete}}</button>"
                },
                input: "<div class=\"ki-text-wrapper\"><input type=\"text\" class=\"ki-text\" id=\"ki-text\"></div>",
                message: "<p class=\"ki-message\"><i class='uk-icon-warning-sign ki-icon'></i>{{message}}</p>",
                log: "<article class=\"ki-log{{class}}\">{{message}}</article>"
            },
            clsEL: "ki-dialog",
            clsElShow: "ki-dialog ki-dialog-showing",
            clsElHide: "ki-dialog ki-dialog-hidden"
        },
        setup: function(type, msg, accept, deny, placeholder) {
            this.opts = $.extend({}, this.default, {
                elCallee: document.activeElement,
                type: type,
                message: msg,
                placeholder: placeholder,
                accept: accept || function() {
                },
                deny: deny || function() {
                }
            });
            this.init();
            if (!this.opts.isOpen) {
                this.open(this.opts);
            }
        },
        open: function(opts) {
            opts.el = $("." + opts.clsEL);
            opts.el.html($._dialog.build(opts));
            ki.elmentReady(opts.el);
            $._cover.show();
            opts.el.attr('class', opts.clsElShow);
            opts.controls.focus = opts.type === 'delete' ? $("#ki-delete") : $("#ki-ok");
            opts.controls.input = opts.type === 'prompt' ? $("#ki-text") : undefined;
            if (opts.controls.input && opts.placeholder && opts.placeholder !== "") {
                opts.controls.input.value = opts.placeholder;
            }
            this.setFocus(opts);
            this.addListeners(opts);
            this.opts = opts;
        },
        setFocus: function(opts) {
            if (opts.controls.input) {
                opts.controls.input.focus().select();
            } else {
                opts.controls.focus.focus();
            }
        },
        build: function(opts) {
            var html = "", type = opts.type, message = opts.message, tpl = opts.tpl, labels = this.labels;
            html += "<div class=\"ki-dialog-inner\">";
            if (type === "prompt") {
                html += "<form id=\"ki-form\">";
            }
            html += "<article class=\"ki-inner\">";
            html += tpl.message.replace("{{message}}", message);
            if (type === "prompt") {
                html += tpl.input;
            }
            html += tpl.buttons.holder;
            html += "</article>";
            if (type === "prompt") {
                html += "</form>";
            }
            html += "</div>";
            switch (type) {
                case "confirm":
                    html = html.replace("{{buttons}}", tpl.buttons.cancel + tpl.buttons.ok);
                    html = html.replace("{{ok}}", labels.ok).replace("{{cancel}}", labels.cancel);
                    break;
                case "delete":
                    html = html.replace("{{buttons}}", tpl.buttons.cancel + tpl.buttons.delete);
                    html = html.replace("{{delete}}", labels.delete).replace("{{cancel}}", labels.cancel);
                    break;
                case "prompt":
                    html = html.replace("{{buttons}}", tpl.buttons.cancel + tpl.buttons.submit);
                    html = html.replace("{{ok}}", labels.ok).replace("{{cancel}}", labels.cancel);
                    break;
                case "alert":
                    html = html.replace("{{buttons}}", tpl.buttons.ok);
                    html = html.replace("{{ok}}", labels.ok);
                    break;
            }
            return html;
        },
        addListeners: function(opts) {
            var controls = opts.controls;
            opts.onBtnOK = function(event) {
                event.preventDefault();
                $._dialog.hide();
                $._dialog.removeListeners();
                controls.input && opts.accept && opts.accept(controls.input.value);
                opts.accept && opts.accept();
                return false;
            };
            opts.onBtnCancel = function(event) {
                event.preventDefault();
                $._dialog.hide();
                $._dialog.removeListeners();
                opts.deny && opts.deny();
                return false;
            };
            $('body').on("click", "#ki-ok", opts.onBtnOK);
            $('body').on("click", "#ki-cancel", opts.onBtnCancel);
            $('body').on("click", "#ki-delete", opts.onBtnOK);
            $('body').on("submit", "#ki-form", opts.onBtnOK);
            this.opts = opts;
        },
        removeListeners: function() {
            $('body').off("click", "#ki-ok", this.opts.onBtnOK);
            $('body').off("click", "#ki-cancel", this.opts.onBtnCancel);
            $('body').off("click", "#ki-delete", this.opts.onBtnOK);
            $('body').off("submit", "#ki-form", this.opts.onBtnOK);
        },
        hide: function() {
            this.opts.el.attr('class', this.opts.clsElHide);
            $._cover.hide();
            this.opts.elCallee.focus();
        },
        alert: function(msg, accept) {
            this.setup("alert", msg, accept);
        },
        confirm: function(msg, accept, deny, isDelete) {
            if (isDelete)
                this.setup("delete", msg, accept, deny);
            else
                this.setup("confirm", msg, accept, deny);
        },
        prompt: function(msg, accept, deny, placeholder) {
            this.setup("prompt", msg, accept, deny, placeholder);
        },
        init: function() {
            if (!$('.' + $._dialog.default.clsEL).length > 0) {
                $('body').append('<section class="' + $._dialog.default.clsElHide + '"></section>');
            }
        }
    };
    $._message = {
        opts: {},
        default: {
            section: "ki-logs",
            prefix: "uk-alert",
            clsShow: 'ki-log ki-log-show',
            clsHide: 'ki-log-hide',
            delay: 5000,
            el: undefined
        },
        error: function(msg, delay) {
            this.show("danger", msg, delay);
        },
        info: function(msg, delay) {
            this.show("warning", msg, delay);
        },
        success: function(msg, delay) {
            this.show("success", msg, delay);
        },
        close: function(opts) {
            opts.el.remove();
        },
        show: function(type, msg, delay) {
            this.init();
            $._message.opts = $.extend({}, this.default, {
                type: type,
                msg: msg,
                delay: delay
            });
            var opts = $._message.opts;
            var id = 'ki_' + ki.getTime();
            $('.' + opts.section).append('<div id="' + id + '"></div>');
            $._message.opts.el = $('#' + id);
            opts.el.attr('class', opts.prefix + " " + opts.prefix + "-" + opts.type + " " + opts.clsHide).html(opts.msg);
            ki.elmentReady(opts.el);
            $('body').on("click", '#' + id, function() {
                $._message.close(opts);
            });
            opts.el.attr('class', opts.prefix + " " + opts.prefix + "-" + opts.type + " " + opts.clsShow);
            this.startTimer();
        },
        startTimer: function() {
            var opts = $._message.opts;
            if (opts.delay !== 0) {
                setTimeout(function() {
                    $._message.close(opts);
                }, opts.delay);
            }
        },
        init: function() {
            if (!$('.' + $._message.default.section).length > 0) {
                $('body').append('<section class="' + $._message.default.section + '"></section>');
            }
        }
    };
    $(function() {
        $._cover.init();
        $._dialog.init();
        $._message.init();
    });
})(jQuery);