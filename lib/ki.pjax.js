(function($) {
    "use strict";
    //require ki.core.js,ki.alert.js,ki.ui.js
    $.pjax = function() {
        //初始化配置
        var opts = {container: "#pjax-container", show: "", prefix: "", suffix: ""};
        $.pjax._opts = opts;
        //监听selector的click事件
        $('body').on('click', 'a[target="pjax"]', function(event) {
            var $this = $(this), href = $this.attr('href');
            //取消事件的默认动作
            event.preventDefault();
            //添加一些ajax参数
            var _opts = $.extend(true, {}, opts, {
                url: href,
                rel: $this.attr('rel'),
                title: $this.attr('title'),
                element: this
            });
            // 发送pjax请求
            $.pjax.request(_opts);
        });
    };

    $.pjax.submit = function(form) {
        var $this = $(form), href = $this.attr('action');
        //添加一些ajax参数
        var _opts = $.extend(true, {}, $.pjax._opts, {
            type: $this.attr("method") || 'POST',
            data: $this.serializeArray().concat({name: 'pjax', value: true}), //序列化form表单参数，并添加pjax=true参数
            url: href,
            rel: $this.attr('rel'),
            title: $this.attr('title'),
            element: form
        });
        // 发送pjax请求
        $.pjax.request(_opts);
    };
    $.pjax.xhr = null;
    $.pjax.opts = {};
    $.pjax._opts = {};
    $.pjax.state = {};
    // 默认配置项
    $.pjax.defaults = {
        element: null, //发起事件的元素
        push: true, // true：添加浏览器历史, false：替换浏览器历史
        show: '', // 展示的动画
        title: '', // 标题
        suffix: '', // 标题后缀
        prefix: '', //标题前缀
        //ajax:
        timeout: 2000,
        type: 'GET',
        dataType: 'html',
        data: {//默认的pjax访问带有一个pjax=true的参数
            pjax: true
        },
        beforeSend: function(xhr) {
            //默认pjax访问带有一个请求头X-PJAX=true
            xhr && xhr.setRequestHeader('X-PJAX', true);
        },
        complete: function(xhr) {
        },
        //使用ki.core.js里定义的ajaxError函数
        error: ki.ajaxError
    };
    // 发送pjax请求
    $.pjax.request = function(opts) {
        opts = $.extend(true, {}, $.pjax.defaults, opts);
        opts.url = getRealUrl(opts.url);
        if (!opts.pop)
            opts.container = $(opts.element).attr('rel') || opts.container;
        $.pjax.opts = opts;
        $.pjax.opts.success = $.pjax.success;
        if ($.pjax.xhr && $.pjax.xhr.readyState < 4) {
            $.pjax.xhr.onreadystatechange = $.noop;
            $.pjax.xhr.abort();
        }
        $.pjax.xhr = $.ajax($.pjax.opts);
    };
    // 调用成功后的回调函数
    $.pjax.success = function(data) {
        if ((data || 'data').indexOf('<html') !== -1) {
            //TODO 返回的是整个页面
            location.href = $.pjax.opts.url;
            return false;
        }
        //---------如果返回的是json数据，格式：{"status":"200", "message":"操作成功", "rel":".content", "forwardUrl":"user.html","title":"user"}
        var json = ki.jsonEval(data);
        if (!$.isEmptyObject(json)) {
            if (ki.dataHandle(json)) {
                if (json.forwardUrl) {
                    var data = {
                        title: json.title,
                        url: json.forwardUrl,
                        container: json.rel
                    };
                    $.pjax.request($.extend({}, $.pjax._opts, data));
                }
                if (json.message) {
                    $._message.success(json.message || ki.message.ok, 0);
                }
            } else {
                return false;
            }
        }
        //----------------------------------------
        // 返回的是普通文本
        var opts = $.pjax.opts;
        //------获得返回页面的标题
        var title = opts.title, el;
        if (!title) {
            var matches = data.match(/<title>(.*?)<\/title>/);
            if (matches)
                title = matches[1];
            if (!title && opts.element) {
                el = $(opts.element);
                title = el.attr('title') || el.text();
            }
        }
        if (title) {
            if (!title.startsWith(opts.prefix))
                title = opts.prefix + title;
            if (!title.endsWith(opts.suffix))
                title += opts.suffix;
            document.title = title;
        }
        //----------------------------------
        //存储浏览器历史用的state
        $.pjax.state = {
            container: opts.container,
            timeout: opts.timeout,
            show: opts.show,
            title: title,
            url: opts.url
        };
        var query = $.param(opts.data);
        if (query !== "") {
            $.pjax.state.url = opts.url + (/\?/.test(opts.url) ? "&" : "?") + query;
        }
        //处理浏览器历史
        if (opts.push) {
            if (!$.pjax.active) {
                history.replaceState($.extend({}, $.pjax.state, {
                    url: null
                }), document.title);
                $.pjax.active = true;
            }
            history.pushState($.pjax.state, document.title, opts.url);
        } else if (opts.push === false) {
            history.replaceState($.pjax.state, document.title, opts.url);
        }
        // 调用页面展现方法
        if (!opts.showFn) {
            opts.showFn = function(data) {
                $.pjax.showFn(opts.show, opts.container, data);
            };
        }
        opts.showFn && opts.showFn(data);
    };
    // 页面展现方法
    $.pjax.showFn = function(showType, container, data) {
        var fx = null;
        if (typeof showType === 'function') {
            fx = showType;
        } else {
            if (!(showType in $.pjax.showFx))
                showType = "_default";
            fx = $.pjax.showFx[showType];
        }
        fx && fx.call($(container), data);
    };
    // 展现动画 可以自定义
    $.pjax.showFx = {
        "_default": function(data) {
            this.html(data);
            $._initUI(this);
        },
        fade: function(data) {
            var _this = this;
            this.fadeOut(500, function() {
                _this.html(data).fadeIn(500, function() {
                    $._initUI(this);
                });
            });
        }
    };
    // 监听浏览器的前进、后退事件
    var popped = ('state' in window.history), initialURL = location.href;
    $(window).bind('popstate', function(event) {
        var initialPop = !popped && location.href === initialURL;
        popped = true;
        if (initialPop)
            return;
        var state = event.state;
        if (state && state.container) {
            if ($(state.container).length) {
                var data = {
                    title: state.title,
                    url: state.url || location.href,
                    container: state.container,
                    push: null,
                    timeout: state.timeout,
                    pop: true
                };
                $.pjax.request($.extend({}, $.pjax._opts, data));
            } else {
                window.location = location.href;
            }
        }
    });

    $.support.pjax = window.history && window.history.pushState && window.history.replaceState &&
            !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/);
    // 判断浏览器是否支持该插件
    if (!$.support.pjax) {
        $.pjax = function() {
            return true;
        };
        $.pjax.request = function(opts) {
            if (opts && opts.url) {
                location.href = opts.url;
            }
        };
    }
    //添加state属性到jQuery对象
    if ($.inArray('state', $.event.props) < 0)
        $.event.props.push('state');
    // 获取URL不带hash的部分,切去掉pjax=true部分
    function getRealUrl(url) {
        return (url || '').replace(/\#.*?$/, '').replace('?pjax=true', '').replace('&pjax=true', '');
    }
})(jQuery);