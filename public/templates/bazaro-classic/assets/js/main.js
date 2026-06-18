/**************************************************
==================== JS Start Here ================
**************************************************/

(function ($) {
	"use strict";

	var windowOn = $(window);

	// preloader Js//
	windowOn.on('load', function () {
		$("#loading").fadeOut(500);
	});

	// Common Js//
	$("[data-background").each(function () {
		$(this).css("background-image", "url( " + $(this).attr("data-background") + "  )");
	});

	$("[data-width]").each(function () {
		$(this).css("width", $(this).attr("data-width"));
	});

	$("[data-height]").each(function () {
		$(this).css("height", $(this).attr("data-height"));
	});

	$("[data-bg-color]").each(function () {
		$(this).css("background-color", $(this).attr("data-bg-color"));
	});

	$("[data-text-color]").each(function () {
		$(this).css("color", $(this).attr("data-text-color"));
	});

	// aq-megamenu
	$(function () {
		$('.aq-header-dropdown nav ul li').each(function () {
			if ($(this).find('.mega-menu').length > 0) {
				$(this).addClass('p-static');
			}
		});
	});


	// mobile menu Js//
	function initOffcanvasMenu(menuClass, offcanvasMenuClass) {
		let $menuWrap = $(menuClass + ' > ul').clone();
		let $sideMenu = $(offcanvasMenuClass + ' nav');
		$sideMenu.empty().append($menuWrap);
		$sideMenu.find('.submenu, .mega-menu').parent().append('<button class="aq-menu-close"></button>');
		$sideMenu.on('click', 'li.has-dropdown > a, button.aq-menu-close', function (e) {
			e.preventDefault();
			let $li = $(this).closest('li');
			$li.toggleClass('active');
			$li.children('.submenu, .mega-menu').slideToggle();
		});
	}
	initOffcanvasMenu('.aq-mobile-menu-active', '.aq-offcanvas-menu');
	initOffcanvasMenu('.aq-mobile-menu-2-active', '.aq-offcanvas-2-menu');



	//  Nice Select Js//
	$('.aq-select select').niceSelect();
	if ($('.aq-select2').length > 0) {
		$(function () {
			$('.aq-select2').select2({
				placeholder: 'city name search here',
				allowClear: true,
				tags: true
			});
		});
	}

	//custom tabs
	document.querySelectorAll('.aq-custom-tabs').forEach(tabsContainer => {
		const buttons = tabsContainer.querySelectorAll('.tab-btn');
		const contents = tabsContainer.querySelectorAll('.category-tab-content');
		buttons.forEach((button, index) => {
			button.addEventListener('click', () => {
				buttons.forEach(btn => btn.classList.remove('active'));
				contents.forEach(content => content.classList.remove('active'));
				button.classList.add('active');
				contents[index].classList.add('active');
			});
		});
	});

	// Masonary Js//
	$('.grid').imagesLoaded(function () {
		var $grid = $('.grid').isotope({
			itemSelector: '.grid-item',
			percentPosition: true,
			masonry: {
				columnWidth: '.grid-item',
			}
		});

		// filter items on button click
		$('.masonary-menu').on('click', 'button', function () {
			var filterValue = $(this).attr('data-filter');
			$grid.isotope({ filter: filterValue });
		});

		//for menu active class
		$('.masonary-menu button').on('click', function (event) {
			$(this).siblings('.active').removeClass('active');
			$(this).addClass('active');
			event.preventDefault();
		});

	});

	// magnificPopup img view //
	$('.popup-image').magnificPopup({
		type: 'image',
		gallery: {
			enabled: true
		}
	});

	// magnificPopup video view //
	$(".popup-video").magnificPopup({
		type: "iframe",
	});

	// Counter Js //
	new PureCounter();
	new PureCounter({
		filesizing: true,
		selector: ".filesizecount",
		pulse: 2,
	});

	// Smooth Scroll Js//
	function smoothSctoll() {
		$('.smooth a').on('click', function (event) {
			let target = $(this.getAttribute('href'));
			if (target.length) {
				event.preventDefault();
				$('html, body').stop().animate({
					scrollTop: target.offset().top - 60
				}, 1500);
			}
		});
	}
	smoothSctoll();


	// back to top //
	function back_to_top() {
		var btn = $('#back_to_top');
		var btn_wrapper = $('.back-to-top-wrapper');
		windowOn.on('scroll', function () {
			if (windowOn.scrollTop() > 300) {
				btn_wrapper.addClass('back-to-top-btn-show');
			} else {
				btn_wrapper.removeClass('back-to-top-btn-show');
			}
		});
		$(document).on('click', '#back_to_top', function (e) {
			e.preventDefault();
			$('html, body').animate({ scrollTop: 0 }, '300');
		});
	}
	back_to_top();


	// for header language
	$(function () {
		let $toggleBtn = $(".aq-header-lang-toggle");
		let $langList = $(".aq-header-lang ul");
		if ($toggleBtn.length > 0) {
			$(document).on('click', function (e) {
				if ($toggleBtn.is(e.target) || $toggleBtn.has(e.target).length) {
					$langList.toggleClass("aq-lang-list-open");
				} else {
					$langList.removeClass("aq-lang-list-open");
				}
			});
		}
	});

	// for header currency
	$(function () {
		let $toggleBtn = $(".aq-header-currency-toggle");
		let $currencyList = $(".aq-header-currency ul");
		if ($toggleBtn.length > 0) {
			$(document).on('click', function (e) {
				if ($toggleBtn.is(e.target) || $toggleBtn.has(e.target).length) {
					$currencyList.toggleClass("aq-currency-list-open");
				} else {
					$currencyList.removeClass("aq-currency-list-open");
				}
			});
		}
	});

	// for header setting
	if ($("#aq-header-setting-toggle").length > 0) {
		window.addEventListener('click', function (e) {
			if (document.getElementById('aq-header-setting-toggle').contains(e.target)) {
				$(".aq-header-setting ul").toggleClass("aq-setting-list-open");
			}
			else {
				$(".aq-header-setting ul").removeClass("aq-setting-list-open");
			}
		});
	}

	//bottom menu active class
	$('.aq-bottom-menu-item').on('click', function () {
		$(this)
			.closest('.aq-bottom-menu')
			.find('.aq-bottom-menu-item.active')
			.removeClass('active');
		$(this).addClass('active');
	});

	// product variation js
	function initColorSwatches() {
		if ($(".aq-product-main").length) {
			$(document).on("click mouseover", ".aq-color-swatch", function () {
				var newImage = $(this).find("img").attr("src");
				var productImage = $(this).closest(".aq-product-main").find(".aq-product-img");
				productImage.attr("src", newImage);
				$(this).siblings(".active").removeClass("active");
				$(this).addClass("active");
			});
		}
	}
	initColorSwatches();


	// countdown js here
	function aq_date_date() {
		const second = 1000,
			minute = second * 60,
			hour = minute * 60,
			day = hour * 24;
		const countdownElement = $('.aq-date-countdown');
		const targetDate = countdownElement.data('date');
		const countDownDate = new Date(targetDate).getTime();
		const interval = setInterval(function () {
			const now = new Date().getTime(),
				distance = countDownDate - now;

			// Calculate values
			let days = Math.floor(distance / day);
			let hours = Math.floor((distance % day) / hour);
			let minutes = Math.floor((distance % hour) / minute);
			let seconds = Math.floor((distance % minute) / second);

			// Format with leading zeros (e.g. 01, 02)
			days = String(days).padStart(2, '0');
			hours = String(hours).padStart(2, '0');
			minutes = String(minutes).padStart(2, '0');
			seconds = String(seconds).padStart(2, '0');

			// Update HTML
			$('#days').text(days);
			$('#hours').text(hours);
			$('#minutes').text(minutes);
			$('#seconds').text(seconds);

			if (distance < 0) {
				clearInterval(interval);
				$('#countdown').html("<span class='alert'>Event Expired</span>");
			}
		}, 1000);
	}
	aq_date_date();


	// cart minus plus js here
	$(document).on('click', '.aq-cart-minus', function () {
		var $input = $(this).parent().find('input');
		var count = Number($input.val()) - 1;
		count = count < 1 ? 1 : count;
		$input.val(count);
		$input.trigger('change');
		return false;
	});
	$(document).on('click', '.aq-cart-plus', function () {
		var $input = $(this).parent().find('input');
		$input.val(Number($input.val()) + 1);
		$input.trigger('change');
		return false;
	});

	//  Return Customer Login Form //
	$('.aq-checkout-login-form-reveal-btn').on('click', function () {
		$('#aqReturnCustomerLoginForm').slideToggle(400);
	});

	//  Show Coupon Toggle Js //
	$('.aq-checkout-coupon-form-reveal-btn').on('click', function () {
		$('#aqCheckoutCouponForm').slideToggle(400);
	});

	// Create An Account Toggle Js //
	$('#cbox').on('click', function () {
		$('#cbox_info').slideToggle(900);
	});

	// Shipping Box Toggle Js //
	$('#ship-box').on('click', function () {
		$('#ship-box-info').slideToggle(1000);
	});

	// ==========================
	// Open Handlers
	// ==========================

	// Wishlist Open
	$(document).on("click", ".aq-wishlist-btn", function () {
		$(".aq-wishlist-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// Compare Open
	$(document).on("click", ".aq-compare-btn", function () {
		$(".aq-compare-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// product-filter
	$(document).on("click", ".aq-product-filter-btn", function () {
		$(".aq-filter-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// cartmini Open
	$(document).on("click", ".aq-cart-btn", function () {
		$(".aq-cartmini-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// description Open
	$(document).on("click", ".aq-des-btn", function () {
		$(".aq-offcanvas-des-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// additional Open
	$(document).on("click", ".aq-additional-btn", function () {
		$(".aq-offcanvas-additional-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// shiping Open
	$(document).on("click", ".aq-shiping-btn", function () {
		$(".aq-offcanvas-shiping-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// review Open
	$(document).on("click", ".aq-review-btn", function () {
		$(".aq-offcanvas-review-active").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// offcanvas Open
	$(document).on("click", ".aq-offcanvas-toggle", function () {
		$(".aq-offcanvas-wrap").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// search Open
	$(document).on("click", ".aq-search-toggle", function () {
		$(".aq-search-wrap").addClass("opened");
		$(".body-overlay").addClass("opened");
	});

	// ==========================
	// Close Handlers
	// ==========================
	$(document).on("click", ".aq-wishlist-close, .aq-compare-close, .aq-cartmini-close, .aq-sidebar-close, .aq-offcanvas-close, .aq-search-close, .body-overlay", function () {
		$(".aq-wishlist-active, .aq-compare-active, .aq-cartmini-active, .aq-offcanvas-des-active, .aq-offcanvas-additional-active, .aq-offcanvas-shiping-active, .aq-offcanvas-review-active, .aq-filter-active, .aq-search-wrap, .aq-offcanvas-wrap").removeClass("opened");
		$(".body-overlay").removeClass("opened");
	});


	// ==========================
	// Close Handlers
	// ==========================
	$(document).on('click', '.aq-note-btn', function () {
		$(".note-active").addClass("opened");
	});
	$(document).on('click', '.aq-coupon-btn', function () {
		$(".coupon-active").addClass("opened");
	});
	$(document).on('click', '.aq-shipping-btn', function () {
		$(".shipping-active").addClass("opened");
	});
	$(document).on('click', '.btn-cancel', function () {
		$(".note-active, .coupon-active, .shipping-active").removeClass("opened");
	});


	// ==========================
	// Delete Item
	// ==========================
	let aq_compare_remove = function (e) {
		// Remove a single item
		$(document).on("click", ".aq-remove", function (e) {
			e.preventDefault();
			var $this = $(this);
			$this.closest(".item-delete").remove();
		});
		// Clear all items in a group
		$(document).on("click", ".clear-all-file", function (e) {
			e.preventDefault();
			$(this).closest(".all-file-delete").find(".item-delete").remove();
		});
	};
	aq_compare_remove();

	$(".med-header-menu-cat-toggle").on("click", function () {
		$('.med-header-menu-off').slideToggle(500);
	});

	// Password Toggle Js //
	document.querySelectorAll('.password-show-toggle').forEach(function (btn) {
		btn.addEventListener('click', function () {
			var parent = btn.closest('.aq-login-input');
			if (!parent) return;
			var inputType = parent.querySelector('.aq_password');
			var openEye = parent.querySelector('.open-eye');
			var closeEye = parent.querySelector('.close-eye');
			if (!inputType) return;
			if (inputType.type === "password") {
				inputType.type = "text";
				if (openEye) openEye.style.display = 'block';
				if (closeEye) closeEye.style.display = 'none';
			} else {
				inputType.type = "password";
				if (openEye) openEye.style.display = 'none';
				if (closeEye) closeEye.style.display = 'block';
			}
		});
	});

	document.addEventListener("click", function (e) {
		const btn = e.target.closest(".copy-btn");
		if (btn) {
			const spanElement = btn.querySelector("span");
			if (!spanElement || btn.classList.contains("copied")) return;
			const originalText = spanElement.innerText;
			navigator.clipboard.writeText(originalText).then(() => {
				btn.classList.add("copied");
				spanElement.innerText = "COPIED";

				setTimeout(() => {
					btn.classList.remove("copied");
					spanElement.innerText = originalText;
				}, 1500);
			}).catch(err => {
				console.error("Copy failed: ", err);
			});
		}
	});


	$(function () {
		if ($(".aq-product-sidebar-widget-filter").length) {
			$(".aq-product-sidebar-widget-filter").each(function () {
				const $wrap = $(this);
				const $slider = $wrap.find(".slider-range");
				const $amount = $wrap.find(".amount-range");
				$slider.slider({
					range: true,
					min: 0,
					max: 500,
					values: [75, 300],
					slide: function (event, ui) {
						$amount.val("$" + ui.values[0] + " - $" + ui.values[1]);
					}
				});
				// initial value set
				$amount.val(
					"$" + $slider.slider("values", 0) +
					" - $" + $slider.slider("values", 1)
				);

			});
		}
	});


	$(function () {
		$('.aq-product-sidebar-widget-brand-item').on('click', function () {
			$('.aq-product-sidebar-widget-brand-item').removeClass('click');
			$(this).addClass('click');
		});
	});

	$(".aq-layout-switcher-item").on("click", function () {
		const layout = $(this).data("layout");
		const $grid = $("#aq-gridLayout");
		const $list = $("#aq-listLayout");
		// active remove
		$(".aq-layout-switcher-item").removeClass("active");
		$(this).addClass("active");
		// grid col class remove
		$grid.removeClass(function (i, cls) {
			return (cls.match(/aq-col-\d+/g) || []).join(" ");
		});
		if (layout === "list") {
			// List view
			$grid.hide();
			$list.show().addClass("aq-list-layout");
		} else {
			// Grid view
			$list.hide().removeClass("aq-list-layout");
			$grid.show().addClass(`aq-${layout}`);
		}
	});

	/* =========================
		custom grid view js
	========================= */
	$(function () {
		function applyDefaultResponsiveLayout() {
			const width = windowOn.width();
			let targetLayout = "";
			if (width <= 767) {
				targetLayout = "col-6";
			} else if (width >= 768 && width <= 1199) {
				targetLayout = "col-4";
			}
			if (targetLayout !== "") {
				const $targetItem = $(`.aq-layout-switcher-item[data-layout="${targetLayout}"]`);
				if (!$targetItem.hasClass("active")) {
					$targetItem.trigger("click");
				}
			}
		}
		applyDefaultResponsiveLayout();
		let resizeId;
		windowOn.on('resize', function () {
			clearTimeout(resizeId);
			resizeId = setTimeout(applyDefaultResponsiveLayout, 200);
		});
	});

	/* =========================
		share-link js
	========================= */
	if ($(".aq-share-link-wrapper").length > 0) {
		let copyText = document.querySelector(".aq-share-link-wrapper");

		copyText.querySelector(".aq-share-copy-btn").addEventListener("click", function () {
			let input = copyText.querySelector("input.aq-share-input");

			input.select();
			document.execCommand("copy");

			copyText.classList.add("active");

			window.getSelection().removeAllRanges();

			setTimeout(function () {
				copyText.classList.remove("active");
			}, 2500);
		});
	}

	/* =========================
		product-filter-select js
	========================= */
	$(function () {
		$('.aq-product-filter-select').on('click', function (e) {
			e.stopPropagation();

			let parent = $(this).closest('.aq-product-filter-select-wrap');
			let content = parent.find('.aq-product-filter-select-content');

			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
				content.removeClass('show');
			} else {
				$('.aq-product-filter-select').removeClass('active');
				$('.aq-product-filter-select-content').removeClass('show');

				$(this).addClass('active');
				content.addClass('show');
			}
		});
		$('.aq-product-filter-select-content').on('click', function (e) {
			e.stopPropagation();
		});
		$(document).on('click', function () {
			$('.aq-product-filter-select').removeClass('active');
			$('.aq-product-filter-select-content').removeClass('show');
		});
	});


	// Function to hide the parent section
	$('.hide-button').on('click', function () {
		$('.aq-header-top-area').slideUp(200);
	});
	$(function () {
		const $salesBox = $('.product-details-live-sales-box');
		const displayDuration = 4600;
		const intervalTime = 10000;

		function showNotification() {
			$salesBox.stop(true, true).fadeIn(500, function () {
			});

			setTimeout(function () {
				$salesBox.stop(true, true).fadeOut(500);
			}, displayDuration);
		}

		let notificationInterval = setInterval(showNotification, intervalTime);

		setTimeout(showNotification, 3000);

		$('.product-details-live-sales-close').on('click', function () {
			$salesBox.stop(true, true).fadeOut(300);
		});
	});


	/* =========================
		slide down text js
	========================= */
	$(function () {
		if (!$(".slide-text").length) {
			return;
		}
		var text = $(".slide-text");
		var collapsedHeight = 45;
		if (text[0].scrollHeight <= collapsedHeight) {
			$(".toggle-btn").hide();
		}
		$(".toggle-btn").on("click", function () {
			if (text.hasClass("active")) {
				text.removeClass("active").css("height", collapsedHeight);
				$(this).text("Read More..");
			} else {
				text.addClass("active").css("height", text[0].scrollHeight);
				$(this).text("Read Less");
			}
		});

	});

	/* =========================
		random-number js
	========================= */
	$(function () {
		function getRandom(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}
		let min = 18;
		let max = 45;
		let count = getRandom(min, max);
		$("#viewerCount").text(count);
		setInterval(function () {
			let change = getRandom(-3, 3);
			count += change;
			if (count < min) count = min;
			if (count > max) count = max;
			$("#viewerCount").fadeOut(200, function () {
				$(this).text(count).fadeIn(200);
			});

		}, 3000);

	});

	/* =========================
		producr scroll js
	========================= */
	document.addEventListener("DOMContentLoaded", () => {
		const containers = document.querySelectorAll(".aq-product-container");

		containers.forEach(container => {
			const products = Array.from(container.querySelectorAll(".aq-product-item"));
			const sentinel = document.querySelector(".aq-load-more");

			if (!sentinel) return;

			const spinner = sentinel.querySelector(".loading-spinner");
			let loadCount = 0;
			const maxLoad = 3;
			let isLoading = false;

			const showLoading = () => { if (spinner) spinner.style.display = "flex"; };
			const hideLoading = () => { if (spinner) spinner.style.display = "none"; };

			const getPerRow = () => {
				const first = container.querySelector(".aq-product-item");
				return first ? Math.max(1, Math.floor(container.offsetWidth / first.offsetWidth)) : 3;
			};

			const observer = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					if (!entry.isIntersecting || isLoading || loadCount >= maxLoad) return;

					isLoading = true;
					showLoading();

					setTimeout(() => {
						const perRow = getPerRow();
						for (let i = 0; i < perRow; i++) {
							const randomProduct = products[Math.floor(Math.random() * products.length)];
							container.append(randomProduct.cloneNode(true));
						}
						loadCount++;
						hideLoading();
						isLoading = false;

						if (loadCount >= maxLoad) {
							observer.disconnect();
							if (sentinel) sentinel.remove();
						}
					}, 500);
				});
			}, { threshold: 1.0 });

			observer.observe(sentinel);
		});
	});



	/* =========================
		producr loadmore js
	========================= */
	document.addEventListener("DOMContentLoaded", () => {
		const containers = document.querySelectorAll(".aq-product-container");

		containers.forEach(container => {
			const products = Array.from(container.querySelectorAll(".aq-product-item"));
			const buttonSentinel = document.querySelectorAll(".aq-load-more-2");
			buttonSentinel.forEach(button => {

				if (!button) return;

				let clickCount = 0;
				const maxClick = 3;
				let isLoading = false;

				const showLoading = () => {
					button.style.display = "none";
				};

				const hideLoading = () => {
					button.style.display = "inline-block";
				};

				const getPerRow = () => {
					const first = container.querySelector(".aq-product-item");
					return first ? Math.max(1, Math.floor(container.offsetWidth / first.offsetWidth)) : 3;
				};

				button.addEventListener("click", () => {

					console.log('ok')
					if (isLoading || clickCount >= maxClick) return;

					isLoading = true;
					showLoading();

					setTimeout(() => {
						const perRow = getPerRow();
						for (let i = 0; i < perRow; i++) {
							const randomProduct = products[Math.floor(Math.random() * products.length)];
							container.append(randomProduct.cloneNode(true));
						}

						clickCount++;
						isLoading = false;

						if (clickCount >= maxClick) {
							button.remove();
						} else {
							hideLoading();
						}
					}, 500);
				});
			});
		});
	});


	/* =========================
		preloader js
	========================= */
	if ($(".progress-wrap").length > 0) {
		$(function () {
			var progressPath = document.querySelector(".progress-wrap path");
			var pathLength = progressPath.getTotalLength();
			progressPath.style.transition = progressPath.style.WebkitTransition = "none";
			progressPath.style.strokeDasharray = pathLength + " " + pathLength;
			progressPath.style.strokeDashoffset = pathLength;
			progressPath.getBoundingClientRect();
			progressPath.style.transition =
				progressPath.style.WebkitTransition = "stroke-dashoffset 10ms linear";
			var updateProgress = function () {
				var scrollTop = windowOn.scrollTop();
				var docHeight = $(document).height() - windowOn.height();
				var dashOffset = pathLength - (scrollTop * pathLength) / docHeight;
				progressPath.style.strokeDashoffset = dashOffset;
			};
			updateProgress();
			windowOn.on('scroll', updateProgress);

			windowOn.on("scroll", function () {
				if ($(this).scrollTop() > 50) {
					$(".progress-wrap").addClass("active-progress");
				} else {
					$(".progress-wrap").removeClass("active-progress");
				}
			});
			/* =========================
			Scroll To Top Click
			========================= */
			$(".progress-wrap").on("click", function (e) {
				e.preventDefault();
				$("html, body").animate({ scrollTop: 0 }, 550);
				return false;
			});
		});
	}


	// popup js //
	if ($('.subscribe-popup').length) {
		const popup = document.querySelector(".subscribe-popup");
		const closeBtn = document.querySelector(".close");

		window.addEventListener("load", function () {
			showPopup();
		});

		function showPopup() {
			setTimeout(function () {
				popup.classList.add("show");
			}, 2500); // 2.5 second delay (change if needed)
		}

		// Close button click
		closeBtn.addEventListener("click", function () {
			popup.classList.remove("show");
		});
	}


})(jQuery);
