var scrollbar = (function() {
    var _scrollbar = {
        init: function($container) {
            if (this.$bar) {
                this.$bar.remove();
                this.$bar = null;
            }
            this.$container = $container;
            this.adjustCSSforContainer();
            this.createBar();
            this.getViewportHeight();
            this.getScrollHeight();
            this.getPercentage();
            this.assignHeight();
            this.bindEvent();
        },
        adjustCSSforContainer: function() {
            this.$container.css({
                overflow: "hidden",
                position: "relative"
            });
        },
        createBar: function() {
            this.$bar = $("<div></div>").addClass("yc-scrollbar")
                .css({
                    position: "absolute",
                    top: this.top,
                    right: this.right,
                    width: this.width,
                    borderRadius: this.width / 2,
                    backgroundColor: this.color,
                    zIndex: 9999,
                    // 滚动条不可选中
                    "-webkit-touch-callout": "none",
                    /* iOS Safari */
                    "-webkit-user-select": "none",
                    /* Chrome/Safari/Opera */
                    "-khtml-user-select": "none",
                    /* Konqueror */
                    "-moz-user-select": "none",
                    /* Firefox */
                    "-ms-user-select": "none",
                    /* Internet Explorer/Edge */
                    "user-select": "none",
                    /* Non-prefixed version, currently */
                });
            this.$container.append(this.$bar);
            this.$content = $(this.$container.children()[0]);
        },
        getViewportHeight: function() {
            this.viewportHeight = this.$container.height();
        },
        getScrollHeight: function() {
            this.scrollHeight = this.$content.height();
            this.scrollHeight = this.scrollHeight < this.viewportHeight ? this.viewportHeight : this.scrollHeight;
        },
        getPercentage: function() {
            var originPercentage = (this.viewportHeight - 2 * this.getTop()) / this.scrollHeight;
            this.percentage = originPercentage > 1 ? (this.viewportHeight - 2 * this.getTop()) / this.viewportHeight : originPercentage;
        },
        assignHeight: function() {
            this.height = this.viewportHeight * this.percentage;
            this.$bar.height(this.height);
        },
        getContainerW: function() {
            this.containerW = this.$container.width();
        },
        getTop: function() {
            return parseFloat(this.top);
        },
        calculateBarPos: function() {
            var scrollTop = this.$content.css("margin-top");
            scrollTop = scrollTop === "auto" ? 0 : scrollTop;
            return (1 - (this.scrollHeight + /*这里是加号的原因 marginTop本身是0或负数*/ parseFloat(scrollTop)) / this.scrollHeight) * (this.viewportHeight - 2 * this.getTop());
        },
        makeSureInRange: function(min, val, max) {
            return Math.min(Math.max(val, min), max);
        },
        bindEvent: function() {
            var self = this;
            var wheelEvent = "onwheel" in document.body ? "wheel" : "onmousewheel" in document.body ? "mousewheel" : "DOMMouseScroll";
            wheelEvent = wheelEvent.replace(/^on/, "");
            // 滚轮事件
            self.$content.on(wheelEvent, {
                    context: self
                }, self.wheelHandler)
                // 拖动滚动条事件
            self.$bar.on("mousedown", {
                context: self
            }, self.mouseDownHandler);
            $(document).on("mouseup", function() {
                $("body").off("mousemove", self.mouseMoveHandler);
                self.recoverSelect();
                self.isNew = true;
            });
        },
        wheelHandler: function(e) {
            var self = e.data.context;
            var type = e.type;
            var disY, wheelDelta;
            switch (type) {
                case "wheel":
                    disY = e.originalEvent.deltaY;
                    if (disY > 0) {
                        disY = self.scrollSpace;
                    } else {
                        disY = -self.scrollSpace;
                    }
                    //disY = Math.abs(disY) === 3 ? disY * 40 : disY;
                    break;
                case "mousewheel":
                    wheelDelta = e.originalEvent.wheelDelta;
                    if (wheelDelta > 0) {
                        disY = -self.scrollSpace
                    } else {
                        disY = self.scrollSpace
                    }
                    //disY = -1 * wheelDelta / 1.2;
                    break;
                case "DOMMouseScroll":
                    if (disY > 0) {
                        disY = self.scrollSpace;
                    } else {
                        disY = -self.scrollSpace;
                    }
                    //disY = e.originalEvent.detail * 40;
                    break;
                default:
                    throw new Error("没有编写" + type + "这类事件的处理函数");
            }
            self.moveContent("wheel", disY);
            self.moveBar();
        },
        mouseDownHandler: function(e) {
            var self = e.data.context;
            self.clickY = e.pageY;
            if (!self.isNew) {
                return;
            }
            $("body").on("mousemove", {
                context: self
            }, self.mouseMoveHandler);
        },
        mouseMoveHandler: function(e) {
            var self = e.data.context;
            self.disableSelect();
            var pageY = e.pageY;
            var diff = pageY - self.clickY;
            var maxDiff = self.viewportHeight - self.height - self.getTop() * 2;
            var maxScrollTop = self.scrollHeight - self.viewportHeight;
            diff = diff > maxDiff ? maxDiff : diff;
            var disY = diff / maxDiff * maxScrollTop;
            self.moveContent("mousemove", disY);
            self.moveBar();
        },
        moveContent: function(type, disY) {
            console.log(disY);
            var self = this;
            var scrollTop = self.$content.css("margin-top"),
                scrollTop = scrollTop === "auto" ? 0 : scrollTop,
                oldScrollTop = -parseFloat(scrollTop),
                maxScrollTop = self.scrollHeight - self.viewportHeight,
                newScrollTop;
            // 如果是mousemove事件 则传进来的disY需要和this.originY叠加 
            // 此时 disY直接代表content应当移动的距离
            if (type === "mousemove") {
                // 用于判断是否是一次全新的拖动
                if (self.isNew === true) {
                    self.originY = oldScrollTop;
                    // 判断完后 关闭 避免同一次拖动中触发两次
                    self.isNew = false;
                }
                oldScrollTop = self.originY;
            }
            newScrollTop = self.makeSureInRange(0, oldScrollTop + disY, maxScrollTop);
            self.$content.css({
                marginTop: -newScrollTop
            });
        },
        moveBar: function() {
            var marginTop = this.calculateBarPos();
            this.$bar.css({
                marginTop: marginTop
            });
        },
        disableSelect: function() {
            // 拖动时 内容不可选
            this.$content.css({
                "-webkit-touch-callout": "none",
                /* iOS Safari */
                "-webkit-user-select": "none",
                /* Chrome/Safari/Opera */
                "-khtml-user-select": "none",
                /* Konqueror */
                "-moz-user-select": "none",
                /* Firefox */
                "-ms-user-select": "none",
                /* Internet Explorer/Edge */
                "user-select": "none",
                /* Non-prefixed version, currently */
            });
        },
        recoverSelect: function() {
            // 拖动结束后 内容恢复可选
            this.$content.css({
                "-webkit-touch-callout": "auto",
                /* iOS Safari */
                "-webkit-user-select": "auto",
                /* Chrome/Safari/Opera */
                "-khtml-user-select": "auto",
                /* Konqueror */
                "-moz-user-select": "auto",
                /* Firefox */
                "-ms-user-select": "auto",
                /* Internet Explorer/Edge */
                "user-select": "auto",
                /* Non-prefixed version, currently */
            });
        },
        animateMoveBar(disY, dur, ease) {
            var scrollTop = this.$content.css("margin-top");
            scrollTop = scrollTop === "auto" ? 0 : scrollTop;
            var barMoveDis = -disY / this.scrollHeight * (this.viewportHeight - 2 * parseFloat(this.top));
            this.$bar.animate({
                marginTop: barMoveDis
            }, {
                duration: dur,
                easing: ease || "swing"
            });
        }
    };

    var S = function(option) {
        this.$bar = null;
        this.$container = null;
        this.$content = null;
        this.$blur = null;
        this.containerW = 0;
        this.right = option.right || ".5%";
        this.height = 0;
        this.width = option.width || 10;
        this.top = option.top || 0;
        this.color = option.color || "#777";
        this.viewportHeight = 0;
        this.scrollHeight = 0;
        this.percentage = 0;
        this.clickY = 0;
        this.scrollSpace = option.scrollSpace || 100;
        // 记录是否是一次新的拖动
        this.isNew = true;
        // 记录上次拖动结束的位置
        this.originY = 0;
    }

    S.prototype = _scrollbar;

    var setup = function(option) {
        return new S(option);
    };

    return {
        setup: setup,
    };
})();