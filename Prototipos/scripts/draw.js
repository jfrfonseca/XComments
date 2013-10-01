// Scroll address bar out of view
(function( win ){
	var doc = win.document;
	
	// If there's a hash, or addEventListener is undefined, stop here
	if( !location.hash && win.addEventListener ){
		
		//scroll to 1
		window.scrollTo( 0, 1 );
		var scrollTop = 1,
			getScrollTop = function(){
				return win.pageYOffset || doc.compatMode === "CSS1Compat" && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
			},
		
			//reset to 0 on bodyready, if needed
			bodycheck = setInterval(function(){
				if( doc.body ){
					clearInterval( bodycheck );
					scrollTop = getScrollTop();
					win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
				}	
			}, 15 );
		
		win.addEventListener( "load", function(){
			setTimeout(function(){
				//at load, if user hasn't scrolled more than 20 or so...
				if( getScrollTop() < 20 ){
					//reset to hide addr bar at onload
					win.scrollTo( 0, scrollTop === 1 ? 0 : 1 );
				}
			}, 0);
		} );
	}
})( this );

// Variables
var canvas = null;
var context = null;
var viewportwidth = $(window).width();
var viewportheight = $(window).height();
var canvaswidth = viewportwidth - 110;
//var canvasheight = viewportheight;
var bgimage = new Image();
var lastPoints = null;
var easing = 0.4;
var brush_size = 1;
var brush_max_size = 3;
var textInput = "";
var brushes = {
'eraserID': '#eraser',
'textID': '#text',
'blackID': '#black',
'brownID': '#brown',
'redID': '#red',
'blueID': '#blue',
'greenID': '#green',
'orangeID': '#orange',
'purpleID': '#purple',
'yellowID': '#yellow'
};
var baseURL = "http://artisticabode.com/draw/";
var panelID = 0;
	
	// Setup event handlers
	window.onload = init;
	function init(e) {
	
		var img = new Image(); // The canvas drawImage() method expects an image object.
		img.src = window.localStorage.canvasImage; // Retrieve the last saved artistic achievement from persistent local storage.
		img.onload = function() { // Only render the saved drawing when the image object has fully loaded the drawing into memory.
			context.drawImage(img, 0, 0); // Draw the image starting at canvas coordinate (0, 0) - the upper left-hand corner of the canvas.
		}
    
		canvas = document.getElementById("panel");
		codeContainer =  document.getElementById("codeContainer");
		lastPoints = Array();
		
		brushes.black();
	
		if (canvas.getContext) {
			canvas.width  = canvaswidth; // in pixels
			canvas.height = codeContainer.clientHeight; // in pixels
			$("#Col1").css("height", canvas.height);
			$("#textWrapper").css("width", canvas.width+7);
			$("#Body").css("width", viewportwidth);
			$("#Body").css("height",codeContainer.clientHeight);

			context = canvas.getContext('2d');
			context.lineCap = "round";
			context.lineJoin = "round";
			context.miterLimit = "10.0";
			context.lineWidth = brush_size;
			context.strokeStyle = "rgba(0, 0, 0, 1)";
			context.font = "normal "+ document.getElementById("fontSize").value +"px MarkerFelt";
			context.textBaseline = "top";
			context.beginPath();
			
			canvas.onmousedown = startDraw;
			canvas.onmouseup = stopDraw;
			canvas.ontouchstart = startDraw;
			canvas.ontouchstop = stopDraw;
			canvas.ontouchmove = drawMouse;	
		}
		
		bgimage.onload = bgimage_draw;
		//swap next two lines for dynamic img file
		//bgimage_getsrc();
		//bgimage.src = "/imgs/draw/paper-bg.jpg";
		
		$(brushes.eraserID).bind('click', brushes.eraser);
		$(brushes.eraserID).bind('dblclick doubletap', brushes.clearall);
		$(brushes.textID).bind('click', brushes.text);
		$(brushes.blackID).bind('click', brushes.black);
		$('#tools #pen').bind('click', brushes.black);
		$(brushes.brownID).bind('click', brushes.brown);
		$(brushes.redID).bind('click', brushes.red);
		$(brushes.greenID).bind('click', brushes.green);
		$(brushes.blueID).bind('click', brushes.blue);
		$(brushes.yellowID).bind('click', brushes.yellow);
		$(brushes.orangeID).bind('click', brushes.orange);
		$(brushes.purpleID).bind('click', brushes.purple);			
	}
	
	function getData(data) {
		var panelData = JSON.parse(data);
		bgimage.src = panelData[panelID].image;
    
	}
	function bgimage_getsrc() {
		$.get(baseURL+'panels/', getData);
	}	
	

	function bgimage_draw() {
		context.drawImage(bgimage, 0, 0, canvas.width, canvas.height);
	}
	
	function convertCanvas(strType) {
		if (strType == "PNG")
			var oImg = Canvas2Image.saveAsPNG(canvas, true);

		if (!oImg) {
			alert("Sorry, this browser is not capable of saving " + strType + " files!");
			return false;
		}

		oImg.id = "canvasimage";

		oImg.style.border = canvas.style.border;
		canvas.parentNode.replaceChild(oImg, canvas);
		
		//$('li.active').removeClass('active');
		$('#convertpngbtn').addClass('Hide');
		$('#tools').addClass('Hide');
		$('#colors').addClass('Hide');
		$('#resetbtn').removeClass('Hide');
		$('.Saved').removeClass('Hide');
		
		window.localStorage.canvasImage = canvas.toDataURL();
		$('#canvasimage').attr('title', 'Right click and Save Image As...');

		showDownloadText();
	}

	function saveCanvas(pCanvas, strType) {
		var bRes = false;
		if (strType == "PNG")
			bRes = Canvas2Image.saveAsPNG(canvas);

		if (!bRes) {
			alert("Sorry, this browser is not capable of saving " + strType + " files!");
			return false;
		}
	}
	
	/*
	document.getElementById("savepngbtn").onclick = function() {
		saveCanvas(canvas, "PNG");
	}
	*/

	document.getElementById("convertpngbtn").onclick = function() {
		convertCanvas("PNG");
	}
	
	document.getElementById("resetbtn").onclick = function() {
		var oImg = document.getElementById("canvasimage");
		oImg.parentNode.replaceChild(canvas, oImg);
		$('#convertpngbtn').removeClass('Hide');
		$('#resetbtn').addClass('Hide');
		$('.Saved').addClass('Hide');
		$('#tools').removeClass('Hide');
		$('#colors').removeClass('Hide');
		hideDownloadText();
	}
	
	$(document).ready(function(){
	  $("#textarea").autoGrow();
	});
	
	//Text Tool
	function addText(e) {
	  var textInput = $("#textarea").val();
	  var maxPxLength = $('#textarea').width();
	  var leftString = $('#textWindow').css('left');
	  var leftNum = parseFloat(leftString)+11;
	  var topString = $('#textWindow').css('top');
	  var topNum = parseFloat(topString)+60;
	  //document.getElementById("textarea").style.fontSize = document.getElementById("fontSize").value;
	  context.font = "normal "+document.getElementById("fontSize").value+"px MarkerFelt";

	  printAtWordWrap(context, textInput, leftNum, topNum, document.getElementById("fontSize").value, maxPxLength );

		function printAtWordWrap( context , text, x, y, lineHeight, fitWidth)
		{
			fitWidth = fitWidth || 0;
			
			if (fitWidth <= 0)
			{
				context.fillText( text, x, y );
				return;
			}
			var words = text.split(' ');
			var currentLine = 0;
			var idx = 1;
			while (words.length > 0 && idx <= words.length)
			{
				var str = words.slice(0,idx).join(' ');
				var w = context.measureText(str).width;
				if ( w > fitWidth )
				{
					if (idx==1)
					{
						idx=2;
					}
					context.fillText( words.slice(0,idx-1).join(' '), x, y + (lineHeight*currentLine) );
					currentLine++;
					words = words.splice(idx-1);
					idx = 1;
				}
				else
				{idx++;}
			}
			if  (idx > 0)
				context.fillText( words.join(' '), x, y + (lineHeight*currentLine) );
		}
	  
	  $("#textWrapper").removeClass("active");
	  $('#tools li.active').removeClass('active');
	  
	};
	
	 /**
	 * Divide an entire phrase in an array of phrases, all with the max pixel length given.
	 * The words are initially separated by the space char.
	 * @param phrase
	 * @param length
	 * @return*/
		 
     	function getLines(context,phrase,maxPxLength,textStyle) {
		var wa=phrase.split(" "),
			phraseArray=[],
			lastPhrase="",
			l=maxPxLength,
			measure=0;
			context.font = textStyle;
			for (var i=0;i<wa.length;i++) {
				var w=wa[i];
				measure=context.measureText(lastPhrase+w).width;
			if (measure<l) {
				lastPhrase+=(" "+w);
			}else {
				phraseArray.push(lastPhrase);
				lastPhrase=w;
			}
			if (i===wa.length-1) {
				phraseArray.push(lastPhrase);
				break;
			}
		}
		return phraseArray;
	}

	
	function startDraw(e) {
		if (e.touches) {
			brush_size = 1;
			// Touch event
			for (var i = 1; i <= e.touches.length; i++) {
				lastPoints[i] = getCoords(e.touches[i - 1]); // Get info for finger #1
			}
		}
		else {
			// Mouse event
			lastPoints[0] = getCoords(e);
			canvas.onmousemove = drawMouse;
		}
		return false;

	}
	
	// Called whenever cursor position changes after drawing has started
	function stopDraw(e) {
		brush_size = 1;
		e.preventDefault();
		canvas.onmousemove = null;	
	}
	
	function drawMouse(e) {
		if (e.touches) {
			// Touch Enabled
			for (var i = 1; i <= e.touches.length; i++) {
				var p = getCoords(e.touches[i - 1]); // Get info for finger i
				lastPoints[1] = drawLine(lastPoints[i].x, lastPoints[i].y, p.x, p.y);	
			}
		}
		else {
			// Not touch enabled
			var p = getCoords(e);
			lastPoints[0] = drawLine(lastPoints[0].x, lastPoints[0].y, p.x, p.y);
		}
		
		if (brush_size <= brush_max_size) {
			context.lineWidth = brush_size++;	
		}
		
		if($(brushes.eraserID).hasClass('active')) {
			brush_size = 0;
			context.lineWidth = brush_size;
			context.clearRect(p.x-15, p.y-15, 30, 30);
		}
		
		context.stroke();
		context.closePath();
		context.beginPath();
		return false;
	}
	
	// Draw a line on the canvas from (s)tart to (e)nd
	function drawLine(sX, sY, eX, eY) {
		context.moveTo(sX, sY);
		context.lineTo(eX, eY);
		return { x: eX, y: eY };
	}

	// Get the coordinates for a mouse or touch event
	function getCoords(e) {
		if (e.offsetX) {
			// Works in Chrome / Safari (except on iPad/iPhone)
			return { x: e.offsetX, y: e.offsetY };
		}
		else if (e.layerX) {
			// Works in Firefox
			return { x: e.layerX, y: e.layerY };
		}
		else {
			// Works in Safari on iPad/iPhone
			return { x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop };
		}
	}
	
	$('#pen').click(function() {
		if ($("#textWrapper").hasClass('active')) {
		addText();
		}
		$('#tools li.active').removeClass('active');
		$('#tools li#pen').addClass('active');
		$('canvas#panel').removeClass();
		
		$('canvas#panel').click(function() {
			$("#textWrapper").removeClass();
		});
	});

	// Set the pen to black
	brushes.black = function() {
		// Check if black is already selected
		if($(brushes.blackID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#000';
		context.fillStyle = "#000";
		context.lineCap = 'round';
		
		// Remove active state from pen
		$('#colors li.active').removeClass('active');
		
		// Flag that black is now active
		$(brushes.blackID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('black');
	}
	
	// Set the eraser tool
	brushes.eraser = function() {
		if ($("#textWrapper").hasClass('active')) {
		addText();
		}
		// Check if eraser is already selected
		if($(brushes.eraserID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = "rgba(0, 0, 0, 0)";
		context.lineCap = 'square';
		
		
		// Remove active state from pen
		$('#colors li.active').removeClass('active');
		
		//Change tool
		$('#tools li.active').removeClass('active');
		$('#tools li#eraser').addClass('active');
		$('canvas#panel').removeClass();
		$('canvas#panel').addClass('erase');
		
		$('canvas#panel').click(function() {
			$("#textWrapper").removeClass();
		});
	}
	
	// clear canvas
	brushes.clearall = function() {
		if( !confirm('Clear the canvas?') ) { //show confirm dialog
		return false; //do nothing if cancel is clicked (prevent the browser from following clicked link)
		}
		context.clearRect ( 0, 0, canvas.width, canvas.height);
		//erase local storage...
	}
	
	// Set the pen to red
	brushes.red = function() {
		// Check if red is already selected
		if($(brushes.redID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#ff1800';
		context.fillStyle = "#ff1800";
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
					
		// Flag that red is now active
		$(brushes.redID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('red');
	}
	
	// Set the pen to brown
	brushes.brown = function() {
		// Check if brown is already selected
		if($(brushes.brownID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#5c330c';
		context.fillStyle = '#5c330c';
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
		
		// Flag that red is now active
		$(brushes.brownID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('brown');

	}
	
	// Set the pen to blue
	brushes.blue = function() {
		// Check if blue is already selected
		if($(brushes.blueID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#0600ff';
		context.fillStyle = '#0600ff';
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
					
		// Flag that blue is now active
		$(brushes.blueID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('blue');
	}
	
	// Set the pen to green
	brushes.green = function() {
		// Check if red is already selected
		if($(brushes.greenID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#42bd53';
		context.fillStyle = '#42bd53';
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
					
		// Flag that green is now active
		$(brushes.greenID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('green');
	}
	
	// Set the pen to yellow
	brushes.yellow = function() {
		// Check if yellow is already selected
		if($(brushes.yellowID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#ffea00';
		context.fillStyle = '#ffea00';
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
					
		// Flag that yellow is now active
		$(brushes.yellowID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
					
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('yellow');
	}
	
	// Set the pen to orange
	brushes.orange = function() {
		// Check if orange is already selected
		if($(brushes.orangeID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#ff7940';
		context.fillStyle = "#ff7940";
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
		
		// Flag that red is now active
		$(brushes.orangeID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('orange');

	}
	
	// Set the pen to purple
	brushes.purple = function() {
		// Check if purple is already selected
		if($(brushes.purpleID).hasClass('active')) {
			return;
		}
		// Change color and thickness of the line
		context.strokeStyle = '#6633dd';
		context.fillStyle = "#6633dd";
		context.lineCap = 'round';
		
		// Remove active state from other pen
		$('#colors li.active').removeClass('active');
		
		// Flag that red is now active
		$(brushes.purpleID).addClass('active');
		
		//Change tool
		if($(brushes.eraserID).hasClass('active')) {
			$('#tools li#eraser').removeClass('active');
			$('canvas#panel').removeClass('erase');
			$('#tools li#pen').addClass('active');
		}
		
		//Change text color
		$('#textarea').removeClass();
		$('#textarea').addClass('purple');

	}

	// Set the pen to text
	brushes.text = function() {
		// Check if text is already selected
		if($(brushes.textID).hasClass('active')) {
			//addText();
			return;
		}
		// Change color and thickness of the line
		//$("#textWrapper").addClass('active');
					
		//Change tool
		$('#tools li.active').removeClass('active');
		$('#tools li#text').addClass('active');
		$("#textarea").removeAttr("style");
		$('canvas#panel').removeClass();
		$('canvas#panel').addClass('text');		 
		 
		 $("canvas#panel").bind('tap', function(e) {
		   console.log('x: ' + e.pageX + ', y: ' + e.pageY);
			$("#textWindow").css("left", e.pageX-120);
			$("#textWindow").css("top", e.pageY-72);
			$("#textWrapper").addClass('active');
			 
		 }, this);
		 
		 $("canvas#panel").bind("click", function(e){
			 $("#textarea").val("");
			 $("#textWindow").css("left", e.pageX-120);
			 $("#textWindow").css("top", e.pageY-72);
			 $("#textWrapper").addClass('active');
			 $("#textarea").focus();
		});
	}
    
// Add this
var addthis_config = {"data_track_clickback":true};
var addthis_config = {
services_exclude: 'print, email, favorites, google'
}
    
// GA
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-12994233-2']);
_gaq.push(['_trackPageview']);
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();