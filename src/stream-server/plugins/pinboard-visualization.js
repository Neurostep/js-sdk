(function($) {

if (Echo.Utils.isComponentDefined("Echo.StreamServer.Controls.ItemMediaGallery")) return;

var itemMediaGallery = Echo.Control.manifest("Echo.StreamServer.Controls.ItemMediaGallery");

itemMediaGallery.labels = {
	"mediaIsNotAvailable": "<i>Media is not avaiable at this moment...</i>"
};

itemMediaGallery.config = {
	"resizeDuration": 250,
	"contextId": null,
	"currentIndex": 0
};

itemMediaGallery.templates.main =
	'<div class="{class:container}">' +
		'<div class="{class:thumbnails}">' +
			'<div class="{class:items}"></div>' +
		'</div>' +
		'<div class="{class:controls}"></div>' +
	'</div>';

itemMediaGallery.templates.mediaError =
	'<span class="{class:itemErrorLoading}">{label:mediaIsNotAvailable}</span>';


itemMediaGallery.renderers.controls = function(element) {
	var self = this;
	var item = self.config.get("item");
	this.elements = this.config.get("elements");
	this.currentIndex = this.config.get("currentIndex");
	var publish = function() {
		self.events.publish({
			"topic": "onLoadMedia",
			"data": {
				"item": item
			},
			"context": item.config.get("context")
		});
	};
	var controlsContainer = element;
	var itemsContainer = this.dom.get("items");
	var itemClass = this.cssPrefix + "item";
	var controlClass = this.cssPrefix + "control";
	var activeControlClass = this.cssPrefix + 'activeControl';
	$.each(this.elements, function(i, element) {
		element = $(element);
		self.normalizeFlashContent(element);
		var ratio;
		var isCurrentControl = (i == self.currentIndex);
		var itemContainer = $('<div></div>').append(element).addClass(itemClass);
		var showCurrentMedia = function() {
			i == self.currentIndex && itemContainer.css("display", "block") && publish();
		};
		var controlContainer = $('<a href="#"></a>').addClass(controlClass);
		controlContainer.click(function() {
			var control = $(this);
			var currentItem = itemsContainer.children().eq(self.currentIndex);
			$("." + controlClass, controlsContainer).removeClass(activeControlClass);
			control.addClass(activeControlClass);
			itemsContainer.animate({
				"height": itemContainer.height()
			}, self.config.get("resizeDuration"), function() {
				publish();
			});
			currentItem.fadeOut(function() {
				itemContainer.fadeIn(function() {
					self.currentIndex = i;
				});
			});
			return false;
		});
		if (isCurrentControl) {
			controlContainer.addClass(activeControlClass);
		}
		element.one("error", function() {
			//FIX IT
			//itemContainer.empty().append(self.substitute(self.mediaFailedTemplate));
			itemContainer.empty().append("Error");
			showCurrentMedia();
		}).one("load", function() {
			self.loadMediaHandler(element, itemContainer);
			showCurrentMedia();
		});
		itemsContainer.append(itemContainer);
		controlsContainer.append(controlContainer);
	});
	if (this.elements.length == 1) {
		controlsContainer.hide();
	}
	return element;
};

// To avoid bugs with flash content when we show/hide it
// we should try fix it with wmode parameter if needed
itemMediaGallery.methods.normalizeFlashContent = function(element) {
	var tagName = element.get(0).tagName.toLowerCase();
	if (tagName == "iframe") {
		var parts = Echo.Utils.parseURL(element.attr("src") || "");
		if (!/(www\.)?youtube\.com/.test(parts.domain)) return;
		var query = parts.query;
		query = query && ~query.indexOf("wmode")
			? query.replace(/(wmode=)([^&?]+)/g, function($0, $1, $2) {
				if ($2 != "opaque" || $2 != "transparent") {
					return $1 + "opaque";
				}
			})
			: (query ? (query += "&wmode=opaque") : "wmode=opaque");
		parts.path = parts.path || "";
		parts.fragment = parts.fragment ? "#" + parts.fragment : "";
		parts.query = query ? "?" + query : "";
		//FIX IT
		//element.attr("src",	this.substitute("{Data:scheme}://{Data:domain}{Data:path}{Data:query}{Data:fragment}", parts));
	} else if (tagName == "embed") {
		var wmode = element.attr("wmode");
		if (wmode != "opaque" || wmode != "transparent") {
			element.attr("wmode", "opaque");
		}
	}
};

itemMediaGallery.methods.getHiddenElementDimensions = function(parent, element) {
	var dimensions;
	parent.css({
		"postion": "absolute",
		"visibility": "hidden",
		"display": "block"
	});
	dimensions = {
		"width": element.width(),
		"height": element.height()
	};
	parent.css({
		"postion": "",
		"visibility": "",
		"display": ""
	});
	return dimensions;
};

itemMediaGallery.methods.loadMediaHandler = function(element, elementContainer) {
	var self = this;
	var target = this.config.get("target");
	var viewportDimensions = {
		"width": target.width(),
		"height": target.width()
	};
	var getElementDimensions = function() {
		return !elementContainer.is(":visible")
			? self.getHiddenElementDimensions(elementContainer, element)
			: {
				"width": element.width(),
				"height": element.height()
			};
	};
	var elementDimensions = getElementDimensions();
	if (elementDimensions.width > viewportDimensions.width) {
		ratio = viewportDimensions.width / elementDimensions.width;
		element.css({
			"width": viewportDimensions.width,
			"height": elementDimensions.height * ratio
		});
		elementDimensions = getElementDimensions();
	}
	if (elementDimensions.height > viewportDimensions.height) {
		ratio = viewportDimensions.height / elementDimensions.height;
		element.css({
			"width": elementDimensions.width * ratio,
			"height": viewportDimensions.height
		});
	}
};

itemMediaGallery.css =
	'.{class:thumbnails} { overflow: hidden; }' +
	'.{class:item} { width: 100%; display: none; }' +
	'.{class:controls} { text-align: center; margin-top: 10px; }' +
	'.{class:control} { display: inline-block; width: 8px; height: 8px; font-size: 0px; line-height: 8px; outline: none; border-radius: 4px; vertical-align: middle; margin-left: 8px; cursor: pointer; background-color: #c6c6c6; text-decoration: none; transition: all .2s ease-in 0; -moz-transition-property: all; -moz-transition-duration: .2s; -moz-transition-timing-function: ease-in; -moz-transition-delay: 0; -webkit-transition-property: all; -webkit-transition-duration: .2s; -webkit-transition-timing-function: ease-in; -webkit-transition-delay: 0; }' +
	'.{class:control}:hover { background-color: #ee7b11; }' +
	'.{class:activeControl}, .{class:activeControl}:hover { background-color: #524d4d; }';
	//TODO: (isPreIE9 ? '.echo-ItemMediaControl { display: inline; zoom: 1; }' : '') +

Echo.Control.create(itemMediaGallery);
	
})(jQuery);

(function($) {

var plugin = Echo.Plugin.manifest("PinboardVisualization", "Echo.StreamServer.Controls.Stream.Item");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.init = function() {
	this.extendTemplate("replace", "container", plugin.template);
};

plugin.config = {
	"columnWidth": 250,
	"maxChildrenBodyCharacters": 50,
	"mediaSelector": function(content) {
		var dom = $("<div>" + content + "</div>");
		return $("img, video, embed, iframe", dom);
	},
	"itemCSSClassByContentLength": {
		"echo-streamserver-controls-stream-item-smallSizeContent": [0, 69],
		"echo-streamserver-controls-stream-item-mediumSizeContent": [70, 120]
	},
	"gallery": {
		"resizeDuration": 250
	}
};

plugin.labels = {
	"childrenMoreItems": "View more items..."
};

plugin.events = {
	"Echo.StreamServer.Controls.Stream.Item.onRender": function(topic, args) {
		var plugin = this, item = this.component;
		if (item.isRoot() && !plugin.get("rendered")) {
			plugin._getStreamBody(item).isotope("insert", item.dom.root);
			plugin.set("rendered", true);
		} else {
			plugin._refreshView();
		}
	}
};

$.map([ "Echo.StreamServer.Controls.Submit.onEditError",
	"Echo.StreamServer.Controls.Stream.onEditComplete",
	"Echo.StreamServer.Controls.ItemMediaGallery.onLoadMedia",
	"Echo.StreamServer.Controls.Stream.Item.Plugins.Reply.onExpand",
	"Echo.StreamServer.Controls.Stream.Item.Plugins.Reply.onCollapse" ], function(event) {
	plugin.events[event] = function(topic, args) {
		this._refreshView();
	};
});


plugin.component.renderers.content = function(element) {
	var plugin = this, item = this.component;
	return item.parentRenderer("content", arguments).css({
		"width": parseInt(plugin.config.get("columnWidth"))
	});
};

plugin.component.renderers.avatar = function(element) {
	var plugin = this, item = this.component;
	element = item.parentRenderer("avatar", arguments);
	$(":first-child", element).css({
		"width": 30,
		"height": 30
	});
	return element;
};

plugin.component.renderers.container = function(element) {
	var plugin = this, item = this.component;
	var text = Echo.Utils.stripTags(item.get("data.object.content"));
	var css = plugin._getCSSByLength(text.length);
	return item.parentRenderer("container", arguments).addClass(css);
	
};

plugin.component.renderers.text = function(element) {
	var plugin = this, item = this.component;
	if (!item.isRoot()) {
		return element.empty();
	}
	var filteredElements = plugin.config.get("mediaSelector")(item.get("data.object.content"));
	$(filteredElements.selector, element).remove();
	return element;
};

plugin.renderers.childBody = function(element) {
	var plugin = this, item = this.component;
	if (item.isRoot()) {
		return element.empty();
	}
	var text = Echo.Utils.htmlTextTruncate(
		item.get("data.object.content"),
		plugin.config.get("maxChildrenBodyCharacters"),
		"..."
	);
	return element.empty().append(text);
};

plugin.component.renderers.expandChildren = function(element) {
	var plugin = this, item = this.component;
	element.queue("fx", function(next) {
		next();
		plugin._refreshView();
	});
	element = item.parentRenderer("expandChildren", arguments);
	return element;
};

plugin.renderers.media = function(element, dom) {
	var plugin = this, item = this.component;
	var items = plugin.config.get("mediaSelector")(item.get("data.object.content"));
	if (items.length) {
		var config = $.extend(plugin.config.get("gallery"), {
			"target": element,
			"appkey": item.config.get("appkey"),
			"item": item,
			"elements": items
		});
		new Echo.StreamServer.Controls.ItemMediaGallery(config);
	} else {
		element.hide();
	}
	return element;
};

plugin.renderers.textToggleTruncated = function(element) {
	var plugin = this, item = this.component;
	var text = item.parentRenderer("textToggleTruncated", arguments);
	/*
	FIX IT
	element.unbind("click." + item.data.unique).one("click." + item.data.unique, function() {
		plugin.publish(
			item,
			plugin.topic("internal.Stream.Item", "onChangeView"),
			{"item": item, "force": true}
		);
	});*/
	return text;
};

plugin.methods._getCSSByLength = function(length) {
	var plugin = this, item = this.component;
	var handler = function(range, acc, className) {
		if (length >= range[0] && length < range[1]) {
			return (acc = className);
		}
	};
	return Echo.Utils.foldl("", plugin.config.get("itemCSSClassByContentLength"), handler);
};

plugin.methods._getStreamBody = function(item) {
	var stream = item.config.get("parent");
	return $(".echo-streamserver-controls-stream-body", stream.target);
};

plugin.methods._refreshView = function() {
	var plugin = this, item = this.component;
	var stream = plugin._getStreamBody(item);
	stream.isotope("reloadItems").isotope({"sortBy": "original-order"});
};

plugin.template =
	'<div class="{class:container}">' +
		'<div class="{class:header}">' +
			'<div class="{class:avatar}"></div>' +
			'<div class="{plugin.class:topContentWrapper}">' +
				'<div class="{class:authorName} echo-linkColor"></div>' +
				'<div class="{plugin.class:childBody}"></div>' +
				'<div class="echo-clear"></div>' +
			'</div>' +
			'<div class="echo-clear"></div>' +
		'</div>' +
		'<input type="hidden" class="{class:modeSwitch}">' +
		'<div class="echo-clear"></div>' +
		'<div class="{class:wrapper}">' +
			'<div class="{class:subcontainer}">' +
				'<div class="{class:data}">' +
					'<div class="{plugin.class:media}"></div>' + 
					'<div class="{class:body} echo-primaryColor"> ' + 
						'<span class="{class:text}"></span>' +
						'<span class="{class:textEllipses}">...</span>' +
						'<span class="{class:textToggleTruncated} echo-linkColor echo-clickable"></span>' +
					'</div>' +
				'</div>' +
				'<div class="{class:footer} echo-secondaryColor echo-secondaryFont">' +
					'<img class="{class:sourceIcon} echo-clickable">' +
					'<div class="{class:date}"></div>' +
					'<div class="{class:from}"></div>' +
					'<div class="{class:via}"></div>' +
					'<div class="{class:buttons}"></div>' +
					'<div class="echo-clear"></div>' +
				'</div>' +
			'</div>' +
		'</div>' +
	'</div>';

plugin.css =
	'.{plugin.class:media} { margin-top: 7px; text-align: center; }' +
	'.{plugin.class:topContentWrapper} { margin-left: 5px; padding-left: 35px; }' +
	'.{plugin.class:childBody} { float: none; display: inline; margin-left: 5px; }' +
	'.{plugin.class:childBody} a { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class} .{class:container} { padding: 0px; }' +
	'.{plugin.class} .{class:content} { padding-bottom: 0px; background: white; box-shadow: 0 1px 2px rgba(34, 25, 25, 0.4); margin: 0px 5px 15px 5px; border: none; }' +
	'.{plugin.class} .{class:authorName} { float: none; display: inline; margin-left: 0px; }' +
	'.{plugin.class} .{class:body} { margin: 0px; }' +
	'.{plugin.class} .{class:avatar} { float: left; width: 30px; height: 30px; padding-right: 10px; }' +
	'.{plugin.class} .{class:depth-1} { margin-left: 0px; border-bottom: none; }' +
	'.{plugin.class} .{class:depth-1} .{class:authorName} { display: inline; font-size: 12px; }' +
	'.{plugin.class} .{class:depth-0} { padding: 15px 15px 10px 15px; }' +
	'.{plugin.class} .{class:depth-0} .{class:authorName} { font-size: 15px; margin-top: 4px; }' +
	'.{plugin.class} .{class:wrapper} { float: none; }' +
	'.{plugin.class} .{class:subcontainer} { float: none; }' +
	'.{plugin.class} .{class:date} { color: #C6C6C6; text-decoration: none; font-weight: normal; }' +
	'.{plugin.class} .{class:footer} a { color: #C6C6C6; text-decoration: none; font-weight: normal; }' +
	'.{plugin.class} .{class:footer} a:hover { text-decoration: underline; }' +
	'.{plugin.class} .{class:container} .{class:footer} { margin-top: 5px; }' +
	'.{plugin.class} .{class:children} .{class:header} { margin-left: 0px; }' +
	'.{plugin.class} .{class:smallSizeContent} .{class:body} { font-size: 18px; line-height: 25px; }' +
	'.{plugin.class} .{class:mediumSizeContent} .{class:body} { font-size: 16px; line-height: 22px; }' +
	'.{plugin.class} .{class:children} .{class:container} { background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:container} { background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:children} .{class:wrapper}  { display: none; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:wrapper} {display: none}' +
	'.{plugin.class} .{class:replyForm} { box-shadow: none; margin: 0px; border: none; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:children} .{class:content} { box-shadow: none; margin: 0px; padding: 0px; border: none; border-bottom: 1px solid #d9d4d4; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:childrenByCurrentActorLive} .{class:content} { box-shadow: none; margin: 0px; padding: 0px; border: none; border-bottom: 1px solid #d9d4d4; background-color: #F2F0F0; }' +
	'.{plugin.class} .{class:container-child} { margin: 0px; padding: 10px 15px; }' +
	'.{plugin.class} .echo-linkColor { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class} .echo-linkColor a { text-decoration: none; font-weight: bold; color: #524D4D; }' +
	'.{plugin.class} .isotope { -webkit-transition-property: height, width; -moz-transition-property: height, width; -o-transition-property: height, width; transition-property: height, width; }' +
	'.{plugin.class} .isotope, .echo-PinboardVisualization-plugin .isotope .isotope-item { -webkit-transition-duration: 0.8s; -moz-transition-duration: 0.8s; -o-transition-duration: 0.8s; transition-duration: 0.8s; }' +
	'.{plugin.class} .isotope .isotope-item { -webkit-transition-property: -webkit-transform, opacity; -moz-transition-property: -moz-transform, opacity; -o-transition-property: top, left, opacity; transition-property:transform, opacity; }';
	//TODO: add reply, expandChildren, likes and style for isPre9 styles
	
Echo.Plugin.create(plugin);

})(jQuery);

(function($) {

var plugin = Echo.Plugin.manifest("PinboardVisualization", "Echo.StreamServer.Controls.Stream");

if (Echo.Plugin.isDefined(plugin)) return;

plugin.config = {
	"isotope": {
		"animationOptions": {
			// change duration for mozilla browsers
			"duration": $.browser.mozilla || $.browser.msie ? 0 : 2750,
			"easing": "linear",
			"queue": false
		},
		// use only jQuery engine for animation in mozilla browsers
		// due to the issues with video display with CSS transitions
		"animationEngine": $.browser.mozilla || $.browser.msie ? "jquery" : "best-available"
	}
};

plugin.events = {
	"Echo.StreamServer.Controls.Stream.onRender": function(topic, args) {
		var plugin = this, stream = this.component;
		stream.dom.get("body").isotope(
			plugin.config.get("isotope")
		);
	}
};

Echo.Plugin.create(plugin);

})(jQuery);
