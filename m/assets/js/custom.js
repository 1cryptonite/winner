// JavaScript Document

//accordian
$(document).ready(function(){
	// Add minus icon for collapse element which is open by default
	$(".collapse.show").each(function(){
		$(this).prev(".card-header").find(".fa").addClass("fa-chevron-up").removeClass("fa-chevron-down");
	});
	
	// Toggle plus minus icon on show hide of collapse element
	$(".collapse").on('show.bs.collapse', function(){
		$(this).prev(".card-header").find(".fa").removeClass("fa-chevron-down").addClass("fa-chevron-up");
	}).on('hide.bs.collapse', function(){
		$(this).prev(".card-header").find(".fa").removeClass("fa-chevron-up").addClass("fa-chevron-down");
	});

	//slider
	$('.one-time').slick({
		dots: false,
		infinite: true,
		slidesToShow: 1,
		autoplay: true,
		autoplaySpeed:3000,
		adaptiveHeight: true
	});
});

//show-hide


function toggler(divId) {
    $("#" + divId).toggle();
}