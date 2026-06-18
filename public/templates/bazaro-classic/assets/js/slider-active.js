(function ($) {
	"use strict";

	////brand-slider
	let aq_brand_slide = new Swiper(".aqf-text-slide-active", {
		loop: true,
		freemode: true,
		slidesPerView: 'auto',
		spaceBetween: 50,
		centeredSlides: true,
		allowTouchMove: false,
		speed: 2000,
		autoplay: true,
		autoplay: {
		  delay: 1,
		  disableOnInteraction: true,
		},
	});

	//fashion-slider
	let aqf_slider_main = new Swiper('.aqf-slider-active', {
		slidesPerView: 1,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 0,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-slider-prev',
			nextEl: '.aqf-slider-next',
		},
		pagination: {
			el: ".aqf-slider-dot",
			clickable: true,
		},
	});

	//collection-slider
	let product_active = new Swiper('.aq-product-active', {
		slidesPerView: 4,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 25,
		speed: 1000,
		navigation: {
			prevEl: '.aq-product-prev',
			nextEl: '.aq-product-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 4,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//collection-slider
	let product_2_active = new Swiper('.aq-product-2-active', {
		slidesPerView: 4,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 0,
		speed: 1000,
		navigation: {
			prevEl: '.aq-product-prev',
			nextEl: '.aq-product-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 4,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//collection-slider
	let aqf_collection = new Swiper('.aqf-collection-active', {
		slidesPerView: 5,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 20,
		speed: 1000,
		breakpoints: {
			1200: {
			    slidesPerView: 5,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//collection-slider
	let aq_testimonial = new Swiper('.aq-testimonial-active', {
		slidesPerView: 3,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 30,
		speed: 1000,
		breakpoints: {
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 1,
			},
			576: {
			    slidesPerView: 1,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//collection-slider
	let fr_testimonial = new Swiper('.fr-testimonial-active', {
		slidesPerView: 3,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 30,
		speed: 1000,
		breakpoints: {
			1600: {
			    slidesPerView: 3,
			},
			1400: {
			    slidesPerView: 2,
			},
			1200: {
			    slidesPerView: 2,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 1,
			},
			576: {
			    slidesPerView: 1,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//deals-slider
	let aqf_deals_slider = new Swiper('.aqf-deals-slider-active', {
		slidesPerView: 3,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 10,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-deals-prev',
			nextEl: '.aqf-deals-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 3,
			},
			1200: {
			    slidesPerView: 2,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//deals-slider
	let grc_deals_slider = new Swiper('.grc-deals-slider-active', {
		slidesPerView: 4.5,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 10,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-deals-prev',
			nextEl: '.aqf-deals-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 4.5,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//grc-slider
	let grc_slider_active = new Swiper('.grc-slider-active', {
		slidesPerView: 6,
		loop: true,
		autoplay: true,
		arrow: false,
		speed: 1000,
		spaceBetween: 20,
		breakpoints: {
			1400: {
			    slidesPerView: 6,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//grc-slider
	let grc_slider_active_2 = new Swiper('.grc-slider-active-2', {
		slidesPerView: 5,
		loop: true,
		autoplay: true,
		arrow: false,
		speed: 1000,
		spaceBetween: 20,
		breakpoints: {
			1400: {
			    slidesPerView: 5,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//deals-slider
	let gallery_active = new Swiper('.aqb-gallery-active', {
		slidesPerView: 6,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 5,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-deals-prev',
			nextEl: '.aqf-deals-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 6,
			},
			1200: {
			    slidesPerView: 4,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 3,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//bag-product-active
	let bag_product_active = new Swiper('.aqb-product-active', {
		slidesPerView: 4,
		loop: true,
		arrow: false,
		spaceBetween: 10,
		speed: 1000,
		autoplay: false,
		navigation: {
			prevEl: '.bag-product-prev',
			nextEl: '.bag-product-next',
		},
		pagination: {
			el: '.swiper-pagination-progress',
			type: 'progressbar',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 4,
			},
			1200: {
			    slidesPerView: 3,
			},
			992: {
			    slidesPerView: 2,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//bag-product-active
	let category_product_active = new Swiper('.aqb-category-active', {
		slidesPerView: 6,
		loop: true,
		arrow: false,
		spaceBetween: 5,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.bag-product-prev',
			nextEl: '.bag-product-next',
		},
		pagination: {
			el: '.swiper-pagination-progress',
			type: 'progressbar',
		},
		breakpoints: {
			1600: {
			    slidesPerView: 6,
			},
			1400: {
			    slidesPerView: 5,
			},
			1200: {
			    slidesPerView: 4,
			},
			992: {
			    slidesPerView: 3,
			},
			768: {
			    slidesPerView: 2,
			},
			576: {
			    slidesPerView: 2,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//bag-product-active
	let inner_product_active = new Swiper('.aqb-product-inner-active', {
		slidesPerView: 1,
		loop: true,
		arrow: false,
		spaceBetween: 0,
		speed: 1000,
		autoplay: false,
		navigation: {
			prevEl: '.product-inner-prev',
			nextEl: '.product-inner-next',
		},
	});

	//summer-slider-active
	let aqf_summer_active = new Swiper('.aqf-summer-active', {
		slidesPerView: 1,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 0,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-summer-prev',
			nextEl: '.aqf-summer-next',
		},
		breakpoints: {
			992: {
			    slidesPerView: 1,
			},
			768: {
			    slidesPerView: 2,
				spaceBetween: 20,
			},
			576: {
			    slidesPerView: 2,
				spaceBetween: 20,
			},
			0: {
			    slidesPerView: 1,
			},
	    }
	});

	//testimonial-slider-active
	let aqf_testimonial = new Swiper('.aqf-testimonial-active', {
		slidesPerView: 1,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 60,
		speed: 1000,
		navigation: {
			prevEl: '.aqf-testimonial-prev',
			nextEl: '.aqf-testimonial-next',
		},
		pagination: {
			el: ".aqf-testimonial-dot",
			clickable: true,
		},
	});

	//testimonial-slider-active
	let product_slider = new Swiper('.aq-modal-slider-active', {
		slidesPerView: 1,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 10,
		speed: 1000,
		navigation: {
			prevEl: '.aq-modal-prev',
			nextEl: '.aq-modal-next',
		},
	});


	//testimonial-slider-active
	let aq_shopgram = new Swiper('.aq-shopgram-active', {
		slidesPerView: 7,
		loop: true,
		autoplay: true,
		arrow: false,
		spaceBetween: 7,
		speed: 1000,
		navigation: {
			prevEl: '.aq-shopgram-prev',
			nextEl: '.aq-shopgram-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 7,
			},
			1200: {
			    slidesPerView: 5,
			},
			992: {
			    slidesPerView: 4,
			},
			768: {
			    slidesPerView: 3,
			},
			576: {
			    slidesPerView: 2,
			},
			100: {
			    slidesPerView: 2,
			},
	    }
	});
	
	//electronics-slider-active
	let elt_slider = new Swiper('.elt-slider-active', {
		slidesPerView: 2,
		loop: true,
		autoplay: true,
		arrow: true,
		spaceBetween: 20,
		centeredSlides: true,
		speed: 1000,
		navigation: {
			prevEl: '.aq-slider-prev',
			nextEl: '.aq-slider-next',
		},
		breakpoints: {
			1400: {
			    slidesPerView: 2,
			},
			1200: {
			    slidesPerView: 1,
			},
			992: {
			    slidesPerView: 1,
			},
			768: {
			    slidesPerView: 1,
			},
			576: {
			    slidesPerView: 1,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});

	//electronics-slider-active
	let brand_active = new Swiper('.aq-brand-active', {
		slidesPerView: 5,
		loop: true,
		arrow: true,
		autoplay: true,
		spaceBetween: 0,
		centeredSlides: true,
		speed: 1000,
		navigation: {
			prevEl: '.aq-brand-prev',
			nextEl: '.aq-brand-next',
		},
		breakpoints: {
			992: {
			    slidesPerView: 5,
			},
			768: {
			    slidesPerView: 3,
			},
			576: {
			    slidesPerView: 2,
				centeredSlides: false,
			},
			100: {
			    slidesPerView: 1,
			},
	    }
	});
	

	//electronics-slider-active
	let grc_brand_active = new Swiper('.grc-brand-active', {
		slidesPerView: 6,
		loop: true,
		arrow: true,
		autoplay: true,
		spaceBetween: 0,
		speed: 1000,
		breakpoints: {
			1400: {
			    slidesPerView: 6,
			},
			1200: {
			    slidesPerView: 5,
			},
			992: {
			    slidesPerView: 4,
			},
			768: {
			    slidesPerView: 3,
			},
			576: {
			    slidesPerView: 2,
			},
			100: {
			    slidesPerView: 2,
			},
	    }
	});


	//testimonial-slider-active
	let aq_header_discount = new Swiper('.aq-header-discount-active', {
		slidesPerView: 1,
		loop: true,
		arrow: false,
		spaceBetween: 10,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aq-header-prev',
			nextEl: '.aq-header-next',
		},
	});

	//aqf_categories
	let aqf_categories = new Swiper('.aqf-categories-active', {
		slidesPerView: 8,
		loop: true,
		arrow: false,
		spaceBetween: 20,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1200: {
			    slidesPerView: 8,
			},
			992: {
			    slidesPerView: 6,
				spaceBetween: 20,
			},
			768: {
			    slidesPerView: 5,
				spaceBetween: 10,
			},
			576: {
			    slidesPerView: 4,
				spaceBetween: 10,
			},
			100: {
			    slidesPerView: 3,
				spaceBetween: 10,
			},
	    }
	});

	//qf_categories
	let aqf_2_categories = new Swiper('.aqf-categories-2-active', {
		slidesPerView: 7,
		loop: true,
		arrow: false,
		spaceBetween: 50,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1600: {
			    slidesPerView: 7,
			},
			1400: {
			    slidesPerView: 7,
				spaceBetween: 20,
			},
			1200: {
				slidesPerView: 6,
				spaceBetween: 20,
			},
			992: {
			    slidesPerView: 5,
				spaceBetween: 20,
			},
			768: {
			    slidesPerView: 4,
				spaceBetween: 20,
			},
			576: {
			    slidesPerView: 3,
				spaceBetween: 20,
			},
			475: {
			    slidesPerView: 3,
				spaceBetween: 20,
			},
			100: {
			    slidesPerView: 2,
				spaceBetween: 20,
			},
	    }
	});

	//qf_categories
	let aqf_3_categories = new Swiper('.aqf-categories-3-active', {
		slidesPerView: 7,
		loop: true,
		arrow: false,
		spaceBetween: 50,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1600: {
			    slidesPerView: 7,
			},
			1400: {
			    slidesPerView: 7,
				spaceBetween: 20,
			},
			1200: {
				slidesPerView: 6,
				spaceBetween: 20,
			},
			992: {
			    slidesPerView: 5,
				spaceBetween: 20,
			},
			768: {
			    slidesPerView: 3,
				spaceBetween: 20,
			},
			576: {
			    slidesPerView: 3,
				spaceBetween: 20,
			},
			100: {
			    slidesPerView: 2,
				spaceBetween: 20,
			},
	    }
	});


	let aqf_4_categories = new Swiper('.aqf-categories-4-active', {
		slidesPerView: 6,
		loop: true,
		arrow: false,
		spaceBetween: 50,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1600: {
			    slidesPerView: 6,
			},
			1400: {
			    slidesPerView: 6,
			},
			1200: {
				slidesPerView: 6,
				spaceBetween: 20,
			},
			992: {
			    slidesPerView: 5,
				spaceBetween: 20,
			},
			768: {
			    slidesPerView: 4,
				spaceBetween: 20,
			},
			576: {
			    slidesPerView: 3,
				spaceBetween: 20,
			},
			100: {
			    slidesPerView: 2,
				spaceBetween: 20,
			},
	    }
	});

	let aqf_5_categories = new Swiper('.aqf-categories-5-active', {
		slidesPerView: 7,
		loop: true,
		arrow: false,
		spaceBetween: 20,
		speed: 1000,
		autoplay: true,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1800: {
			    slidesPerView: 7,
			},
			1600: {
			    slidesPerView: 6,
			},
			1400: {
			    slidesPerView: 5,
			},
			1200: {
				slidesPerView: 4,
			},
			992: {
			    slidesPerView: 4,
			},
			768: {
			    slidesPerView: 3,
			},
			576: {
			    slidesPerView: 3,
			},
			100: {
			    slidesPerView: 2,
			},
	    }
	});

	
	//testimonial-slider-active
	let med_categories = new Swiper('.med-categories-active', {
		slidesPerView: 8,
		loop: true,
		arrow: false,
		speed: 1000,
		autoplay: true,
		spaceBetween: 30,
		navigation: {
			prevEl: '.aqf-categories-prev',
			nextEl: '.aqf-categories-next',
		},
		breakpoints: {
			1600: {
			  slidesPerView: 8,
			},
			1400: {
			  slidesPerView: 7,
			},
			1200: {
			  slidesPerView: 6,
			},
			992: {
			  slidesPerView: 5,
			},
			768: {
			   slidesPerView: 4,
			},
			500: {
			  slidesPerView: 3,
			},
			0: {
			  slidesPerView: 2,
			},
	    }
	});

	// aqf_category
	let aqf_category = new Swiper(".aqf-category-2-active", {
		effect: "coverflow",
		grabCursor: true,
		centeredSlides: true,
		loop: true,
		autoplay: true,
		coverflowEffect: {
			rotate: 0,
			stretch: 0,
			depth: 150,
			modifier: 2,
			slideShadows: false,
		},

		// Navigation arrows
		navigation: {
			nextEl: ".swiper-button-next",
			prevEl: ".swiper-button-prev"
		},
		
		keyboard: {
			enabled: true
		},

		mousewheel: {
			enabled: false, 
		},

		breakpoints: {
			1400: {
			  slidesPerView: 3,
			},
			1200: {
			  slidesPerView: 3,
			},
			768: {
			   slidesPerView: 2,
			},
			576: {
			  slidesPerView: 2,
			},
			0: {
			  slidesPerView: 1,
			},
	    }
	});


	// // Arrival product slider
	let arrivals_nav = new Swiper(".aqf-arrivals-nav-active", {
		speed: 1200,
		spaceBetween: 0,
		slidesPerView: 1,
		centeredSlides: true,
		loop: true,
		loopedSlides: 5,
		watchSlidesProgress: true,
	});

	let arrivals_product = new Swiper(".aqf-arrivals-product-active", {
		speed: 1200,
		spaceBetween: 30,
		slidesPerView: 1,
		centeredSlides: true,
		loop: true,
		loopedSlides: 5,
		autoplay: {
			delay: 3000,
			disableOnInteraction: false,
		},
		navigation: {
			prevEl: '.arrow-prev',
			nextEl: '.arrow-next',
		},
	});

	// Sync both Swipers
	arrivals_product.controller.control = arrivals_nav;
	arrivals_nav.controller.control = arrivals_product;



    // Connect both Swipers
	if ($(".product-details-slider-wrap").length > 0) {
		$('.slider-for').slick({
			slidesToShow: 1,
			slidesToScroll: 1,
			arrows: true,
			fade: false,
			infinite: true,
			autoplay: true,
			asNavFor: '.slider-nav, .slider-nav-2',
			appendArrows: '.product-slider-arrow',
			prevArrow: `<button type="button" class="slick-prev">
				<svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" fill="none">
					<path d="M5.75 10.75L0.75 5.75L5.75 0.75" stroke="currentcolor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>`,
			nextArrow: `<button type="button" class="slick-next">
				<svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" fill="none">
					<path d="M0.75 10.75L5.75 5.75L0.75 0.75" stroke="currentcolor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>`,
		});
		
		$('.slider-nav').slick({
			slidesToShow: 3,
			slidesToScroll: 1,
			vertical: true,
			verticalSwiping: true,
			infinite: true,   
			asNavFor: '.slider-for',
			centerMode: false,
			dots: false,
			arrows: false,
			autoplay: true,
			focusOnSelect: true,
			responsive: [
				{
					breakpoint: 1200,
					settings: {
						vertical: false,
						centerMode: true,
						slidesToShow: 2,
						verticalSwiping: false,
					}
				},
			]
		});

		$('.slider-nav-2').slick({
			slidesToShow: 5,
			slidesToScroll: 1,
			infinite: true,   
			asNavFor: '.slider-for',
			centerMode: false,
			dots: false,
			arrows: false,
			autoplay: true,
			focusOnSelect: true,
		});
	}

	$(document).ready(function () {
		$('.collapse').on('show.bs.collapse', function () {
			$(this).siblings('a').addClass('active');
		});
		$('.collapse').on('hide.bs.collapse', function () {
			$(this).siblings('a').removeClass('active');
		});
	});



})(jQuery);