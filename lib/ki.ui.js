(function($) {
    //页面初始化方法，在初次加载页面与pjax访问成功后调用，一些需要初始化的jQuery插件请在这里进行初始化
    $._initUI = function(dom) {
        var $p = $(dom || document);
        $("[data-uk-grid-match],[data-uk-grid-margin]", $p).each(function() {
            var grid = $(this);
            if (grid.is("[data-uk-grid-match]") && !grid.data("grid-match")) {
                grid.data("grid-match", new $.UIkit['grid-match'](grid, $.UIkit.Utils.options(grid.data("uk-grid-match"))));
            }
            if (grid.is("[data-uk-grid-margin]") && !grid.data("grid-margin")) {
                grid.data("grid-margin", new $.UIkit['grid-margin'](grid, $.UIkit.Utils.options(grid.data("uk-grid-margin"))));
            }
        });
        $("[data-uk-switcher]", $p).each(function() {
            var switcher = $(this);
            if (!switcher.data("switcher")) {
                switcher.data("switcher", new $.UIkit['switcher'](switcher, $.UIkit.Utils.options(switcher.data("uk-switcher"))));
            }
        });
        $("[data-uk-tab]", $p).each(function() {
            var tab = $(this);
            if (!tab.data("tab")) {
                tab.data("tab", new $.UIkit['tab'](tab, $.UIkit.Utils.options(tab.data("uk-tab"))));
            }
        });
        $("[data-uk-scrollspy]", $p).each(function() {
            var element = $(this);
            if (!element.data("scrollspy")) {
                element.data("scrollspy", new $.UIkit['scrollspy'](element, $.UIkit.Utils.options(element.data("uk-scrollspy"))));
            }
        });
        $("form", $p).validator({
            //theme: 'yellow_right',
            stopOnError: false,
            valid: function(e, form) {
                $.pjax.submit(form);
            }
        });
        $('#datepicker1').datepicker();
    };
})(jQuery);