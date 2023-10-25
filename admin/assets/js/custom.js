$(document).on('click', function() {
 if ($("body").hasClass("addleftmenu")) {

     $('body').removeClass('addleftmenu');
}});
$(document).on('click', '.sportSetting',function() {
  setTimeout(function(){ $('body').addClass('addleftmenu'); }, 0.1);

  });
$(".mmenu_left").click(function(){
  $("body").toggleClass("addleftcls");
});

$(".mmenu_right").click(function(){
  $("body").toggleClass("addrightcls");
});

$(".mmenu_left").click(function(){
  $("body").removeClass("addrightcls");
});

$(".mmenu_right").click(function(){
  $("body").removeClass("addleftcls");
});

$(".usermenu").click(function(){
  $("body").toggleClass("addusermenu");
});

$(".usermenu").click(function(){
  $("body").removeClass("addleftcls");
});

$(".leftmenu").click(function(){
  alert('s');
  $("body").toggleClass("addleftmenu");
});

$(".leftmenu").click(function(){
  $("body").removeClass("addleftcls");
});

