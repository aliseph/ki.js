"use strict";
var ki = {//ki里面包含一些可配置项目与工具方法
    status: {ok: '200', error: '300', timeout: '301', forbidden: '403'},
    message: {ok: "Success", error: "Fail", timeout: 'Timeout', forbidden: 'Warning'},
    getTime: function() {
        return new Date * 1;
    },
    elmentReady: function(el) {
        if (el && el.scrollTop() !== null) {
            return;
        } else {
            this.elmentReady();
        }
    },
    //json格式化工具
    jsonEval: function(data) {
        try {
            if ($.type(data) === 'string')
                return eval('(' + data + ')');
            else
                return data;
        } catch (e) {
            return {};
        }
    },
    //默认的ajax错误处理方法
    ajaxError: function(xhr, ajaxOptions, thrownError) {
        $._message.error("<div>Http status: " + xhr.status + " " + xhr.statusText + "</div>"
                + "<div>ajaxOptions: " + ajaxOptions + "</div>"
                + "<div>thrownError: " + thrownError + "</div>"
                + "<div>" + xhr.responseText + "</div>", 0);
    },
    //默认的json类型的返回数据的处理方法
    dataHandle: function(json) {
        if (json.status === ki.status.error) {
            $._message.error(json.message || ki.message.error, 0);
        } else if (json.status === ki.status.forbidden) {
            $._message.error(json.message || ki.message.forbidden, 0);
        } else if (json.status === ki.status.timeout) {
            $._dialog.alert(json.message || ki.message.timeout, function() {
                location.href = "sign-in.html";
            });
        } else if (json.status === ki.status.ok) {
            return true;
        }
        return false;
    },
    //默认的ajax访问成功后的回调函数
    ajaxDone: function(data) {
        if (data.status === undefined && data.message === undefined) {
            $._message.error(data.message || ki.message.error, 0);
            return false;
        }
        if (ki.dataHandle(data)) {
            $._message.success(data.message || ki.message.ok, 0);
        }
    }
};
//除去pjax外的一些核心方法
(function($) {
    $.ajaxTodo = function(selector) {
        if (!selector) {
            throw new Error('selector must be set');
        }
        $('body').on('click', selector, function(event) {
            if (this.tagName.toUpperCase() !== 'A') {
                throw new Error('click requires an anchor element');
            }
            var $this = $(this), url = $this.attr('href'), title = $this.attr("title"), todo = $this.attr("todo");
            if (title) {
                $._dialog.confirm(title, function() {
                    ajaxTodo(url, $this.attr("callback"));
                }, function() {
                }, todo && todo === "delete");
            } else {
                ajaxTodo(url, $this.attr("callback"));
            }
            event.preventDefault();
        });
    };
    function ajaxTodo(url, callback) {
        var $callback = callback || ki.ajaxDone;
        if (!$.isFunction($callback))
            $callback = eval('(' + callback + ')');
        $.ajax({
            type: 'POST',
            url: url,
            dataType: "json",
            cache: false,
            success: $callback,
            error: ki.ajaxError
        });
    }
    //扩展string的方法
    $.extend(String.prototype, {
        startsWith: function(pattern) {
            return this.indexOf(pattern) === 0;
        },
        endsWith: function(pattern) {
            var d = this.length - pattern.length;
            return d >= 0 && this.lastIndexOf(pattern) === d;
        }
    });
    $(function() {
        $.pjax();//初始化pjax
        $.ajaxTodo("a[target='ajaxTodo']"); //初始化ajaxTodo
        $._initUI();//初始化UI组件
    });
})(jQuery);
