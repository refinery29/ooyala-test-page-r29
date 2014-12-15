//Video list plugin
//version 1.0.3
(function( $ ) {
  
  var settings = {
      playerPlacement: function(v){
        new _updateDOM(this,v)
      },
      defaultDomain: window.location.protocol + '//' + window.location.host + '/static/assets',
      videoListFetchedError: "Cant find feed",
      nextVideoInterval: 5,
      shareButtonDelay: 2500,
      shareScreenOnPauseDelay : 200
    }; 
  var _updateDOM = function(self, $videoContainer){
    var $startPage = $(
      "<div class='startPage'>"+
        "<img class='mainPlayButton' src='"+settings.defaultDomain+"/images/ooyala-player/play_button.png'>"+
        "<img class='loadingContainer' src='"+settings.defaultDomain+"/images/ooyala-player/loading.gif'>"+
      "</div>"
    ),
    $overlayPage = $(
      "<div class='overlayPage'>"+
        "<div class='background'></div>"+
        "<div class='sharePage'>"+
          "<p>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/shareText.png' alt='Share'>"+
          "</p>"+
          "<div class='social'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/facebook.png' alt='Facebook' class='facebook'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/pinterest.png' alt='Pinterest' class='pinterest'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/twitter.png' alt='Twitter' class='twitter'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/email.png' alt='Email Sharing' class='emailSharing'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/urlSharing.png' alt='Url Sharing' class='urlSharing'>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/embedSharing.png' alt='Embed Sharing' class='embedSharing'>"+
          "</div>"+
            "<form name='share_video'>"+
              "<div class='url_container'>"+
                "<img src='"+settings.defaultDomain+"/images/ooyala-player/urlText.png' alt='Url'>"+
                "<input type='text' class='url'>"+
              "</div>"+
              "<div class='embed_container'>"+
                "<img src='"+settings.defaultDomain+"/images/ooyala-player/embedText.png' alt='Embed'>"+
                "<input type='text' class='embed'>"+
              "</div>"+
            "</form>"+
        "</div>"+
        "<div class='endPage'>"+
          "<div class='leftPart'>"+
            "<p class='justWatched'>JUST WATCHED</p>"+
            "<p class='description'></p>"+
            "<img src='"+settings.defaultDomain+"/images/ooyala-player/facebookButton.png' alt='f' class='shareFb'>"+
            "<div class='replayButton'>"+
              "<img src='"+settings.defaultDomain+"/images/ooyala-player/replayIcon.png' alt='Replay'>"+
              "<span>REPLAY</span>"+
            "</div>"+
          "</div>"+
          "<div class='rightPart'>"+
            "<p class='upNext'>UP NEXT</p>"+
            "<p class='description'>VIDEO DESCRIPTION</p>"+
            "<img class='thumbnail' alt='Next video' src='"+settings.defaultDomain+"/images/ooyala-player/noImage.png'>"+
            "<p class='timer'>STARTS IN <span class='timeToNextVideo'>0s</span>"+ 
          "</div>"+
        "</div>"+
      "</div>"
    ),
    $shareButton = $(
      "<div class='shareButton'></div>"
    );

    self.append( $videoContainer ).append( $startPage ).append( $overlayPage ).append( $shareButton );
  }
    
  
  var videoList = function(player, global){
    this.player = player;
    this.global = global;
  };
  
  videoList.prototype = {
    eventHooks : {
      CONTENT_TREE_FETCHED : function(event, content){
        var self = this.global;
        self.player = this.player;
        /* if there is an error with loading video list we hiding play button*/
        if (!self.videoList){
          $(self.el).find('.mainPlayButton').hide();
        }

        self.currentVideo = {};
        if (self.player.isFlash){
          self.currentVideo.title = content.title;
          self.currentVideo.thumbnail = content.promo;
          self.currentVideo.embedCode = content.embedCode;
        }
        else{
          self.currentVideo.title = content.title;
          self.currentVideo.thumbnail = content.promo_image;
          self.currentVideo.embedCode = content.embed_code;
        }
        $(self.el).find('.startPage,.overlayPage .background').css('background-image','url('+self.currentVideo.thumbnail+')');
        self.currentVideo.description = content.description;

        var platform = self.settings.favorHtml5 ? "html5-priority" : "flash";
        self.currentVideo.embedUrl = '<iframe width="'+$(self.el).width()+'" height="'+$(self.el).height()+'" src="'+'http://player.ooyala.com/iframe.html'+'?ec='+self.currentVideo.embedCode+'&pbid='+self.settings.playerId+'&platform='+platform+'"></iframe>';
        self.player.nextVideoNumber = self.player.custom.getNextVideoNumber();
        self.player.custom.updateEndScreen();
        if (!self.player.custom.firstRun){
          self.player.mb.publish('play');
        }
      },
      PLAYER_CREATED: function(event, elementId){

        var self = this.global;
        self.player = this.player;
        
        var rootElement = $(self.el);
        var playButton = rootElement.find('.mainPlayButton'),
            pauseButton = rootElement.find('.pauseButton'),
            replayButton = rootElement.find('.replayButton'),
            shareButton = rootElement.find('.shareButton'),
            facebookButton = rootElement.find('.shareFb, .sharePage .facebook'),
            twitterButton = rootElement.find('.sharePage .twitter'),
            pinterestButton = rootElement.find('.sharePage .pinterest'),
            emailSharingButton = rootElement.find('.sharePage .emailSharing'),
            urlSharingButton = rootElement.find('.sharePage .urlSharing'),
            embedSharingButton = rootElement.find('.sharePage .embedSharing'),
            nextVideoButton = rootElement.find('.endPage .rightPart');

        self.player.custom = {};     //object for custom variables
        self.player.custom.firstRun = true;
        self.player.isFlash = rootElement.find("object").length > 0;
        self.player.isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

        /*
         * HTML5 player fixes:
         * - share button replacement
         * - overlay page replacement
         */
        if (!self.player.isFlash){
          shareButton.css('bottom', 44+'px');
          shareButton.appendTo(rootElement.find('.oo_controls_inner'));
              /* following code resolves sharebutton bug in html5 player*/
          shareButton.remove();
          shareButton = rootElement.find('.oo_controls_inner .shareButton');

          var overlayPage = rootElement.find('.overlayPage');
          rootElement.find(".innerWrapper .oo_promo").before(overlayPage);
        }

        /*
         * Functions
         */
        self.player.custom.updateEndScreen = function (){
          rootElement.find('.endPage .leftPart .description').html(self.currentVideo.title.toUpperCase());
          rootElement.find('.endPage .rightPart .description').html(self.videoList[self.player.nextVideoNumber].title.toUpperCase());
          rootElement.find('.endPage .rightPart .thumbnail').attr('src',self.videoList[self.player.nextVideoNumber].thumbnail);
        }
        self.player.custom.getNextVideoNumber = function(){
          var currentEmbedCode = self.currentVideo.embedCode?self.currentVideo.embedCode:self.player.embedCode;
          for (var i=0;i<self.videoList.length;i++){
            if (self.videoList[i].embed_code === currentEmbedCode)
              break;
          }
          i++;
          if (i>=self.videoList.length) i=0;
          return i;
        }
        self.player.custom.playNextVideo = function(nextVideoNumber){
          self.player.setEmbedCode(self.videoList[nextVideoNumber].embed_code);      //next video switch
          self.player.custom.firstRun = false;
          clearInterval(self.player.custom.nextVideoId);
        }
        self.player.custom.popitup = function(url) {
          var popup_width = 686;
          var popup_height = 437;
          var left = (screen.width - popup_width) / 2;
          var top = (screen.height - popup_height) / 2;
          var newWindow=window.open(url,'name','height='+popup_height+',width='+popup_width+', left='+left+', top='+top);
          if (window.focus) {newWindow.focus()}
          return false;
        }

        /*
         * Event listeners
         */
        playButton.click(function(){
          if (!self.player.isAndroid){
            rootElement.find('.mainPlayButton').hide();
            rootElement.find('.loadingContainer').show();
          }
          self.player.mb.publish('play');
        });
        shareButton.click(function(){
          if (self.player.getState() === 'playing'){
            self.player.mb.publish('pause');
            clearTimeout( self.player.custom.pausedTimeoutId);
            self.player.custom.pausedTimeoutId = setTimeout(function(){
              $(self.el).addClass("oo-player-shareScreen");
            },settings.shareScreenOnPauseDelay);
          }
          else{
            rootElement.toggleClass("oo-player-shareScreen");
          }
        });
        facebookButton.click(function(){
          var url = 'https://www.facebook.com/dialog/feed?'+
          'app_id='+self.settings.facebookAppId+
          "&link="+encodeURIComponent(location.host+location.pathname+'?v='+self.currentVideo.embedCode)+
          "&display=popup"+
          "&name="+encodeURIComponent(self.currentVideo.title)+
          "&caption="+" "+
          "&description="+encodeURIComponent(self.currentVideo.description)+
          "&picture="+encodeURIComponent(self.currentVideo.thumbnail)+
          "&redirect_uri="+settings.defaultDomain+'/popupClose.html';
          self.player.custom.popitup(url);
        });
        twitterButton.click(function(){
          var url = encodeURIComponent(location.protocol+'//'+location.hostname+location.pathname+'?v='+self.currentVideo.embedCode);
          self.player.custom.popitup("http://twitter.com/intent/tweet?url="+url+"&text="+encodeURIComponent(self.currentVideo.title));
        });
        pinterestButton.click(function(){
          self.player.custom.popitup("http://www.pinterest.com/pin/create/button/?url="+encodeURIComponent(location.protocol+'//'+location.host+location.pathname+'?v='+self.currentVideo.embedCode)+"&media="+self.currentVideo.thumbnail+"&description="+self.currentVideo.title);
        });
        emailSharingButton.click(function(){
            var title = self.currentVideo.title.replace(/&/g,"");
            window.location = "mailto:%20?subject=Refinery29: "+title+"&body="+title+"%0D%0A"+encodeURIComponent(location.protocol+'//'+location.host+location.pathname+'?v='+self.currentVideo.embedCode);
        });
        urlSharingButton.click(function(){
          var url = self.player.getItem().hostedAtURL;
          rootElement.find('.sharePage .url').val(url);
          rootElement.find('.sharePage form .embed_container').hide();
          rootElement.find('.sharePage form .url_container').show();
        });
        embedSharingButton.click(function(){
          rootElement.find('.sharePage .embed').val(self.currentVideo.embedUrl);
          rootElement.find('.sharePage form .url_container').hide();
          rootElement.find('.sharePage form .embed_container').show();
        });
        replayButton.click(function(){
          self.player.mb.publish('seek', 0);
          self.player.mb.publish('play');
          clearInterval(self.player.custom.nextVideoId);
        });
        nextVideoButton.click(function(){
          clearInterval(self.player.custom.nextVideoId);
          self.player.custom.playNextVideo(self.player.nextVideoNumber);
        });
        rootElement.mousemove(function(){
          clearTimeout(self.player.custom.shareId);
          shareButton.show();
          self.player.custom.shareId = setTimeout(function(){
              shareButton.hide();
              },settings.shareButtonDelay);
        });

      },
      PLAYHEAD_TIME_CHANGED: function (event, time) {
        if (time>1 && time<5){
            $(this.global.el).find('.loadingContainer').hide();
        }
      },
      PLAYED: function (event, elementId) {
        var self = this.global;
        self.player = this.player;
        
        if (self.player.isFullscreen()){
          self.player.mb.publish('willChangeFullscreen', false);
        }
        var videoInterval = settings.nextVideoInterval;
        var nextVideoTimer = $(self.el).find('.timeToNextVideo');
        var endPage = $(self.el).find('.endPage');
        nextVideoTimer.html(videoInterval+'S');
        clearInterval(self.player.custom.nextVideoId);
        self.player.custom.nextVideoId = setInterval(function(){
          videoInterval-=1;
          if (videoInterval<0){
            clearInterval(self.player.custom.nextVideoId);
            self.player.custom.playNextVideo(self.player.nextVideoNumber);
            return true;
          }
          nextVideoTimer.html(videoInterval+'S')
        },1000);
      }
    },
    
    throwVideoListError : function(){

      $(this.global.el)
        .removeClass( "oo-player-loading" )
        .addClass( "oo-player-error" )
        .trigger( "ooyala.error", [ err ] );
        var err = new Error( "Could not retrieve video list from " + this.global.settings.feedUrl );
        throw err;
    },
    
    parseVideoList : function(data){
      var self = this.global;
      self.videoList = [];
      if (typeof(data)!=="object" || !data.getElementsByTagName('item')){
          this.throwVideoListError();
        }
        var items = data.getElementsByTagName('item');
        var title, description, thumbnail;

        for (var i=0;i<items.length;i++){
          self.videoList[i]={};
          self.videoList[i].title = items[i].getElementsByTagName('title')[0].firstChild.nodeValue;
          self.videoList[i].description = items[i].getElementsByTagName('description')[0]?items[i].getElementsByTagName('description')[0].firstChild.nodeValue:'';
          self.videoList[i].thumbnail = items[i].getElementsByTagNameNS('*','thumbnail')[0]?items[i].getElementsByTagNameNS('*','thumbnail')[0].getAttribute('url'):'';
          self.videoList[i].fileName = items[i].getElementsByTagNameNS('*','originalFilename')[0]?items[i].getElementsByTagNameNS('*','originalFilename')[0].firstChild.nodeValue:'';
          var url = items[i].getElementsByTagNameNS('*','content')[0].getAttribute('url');
          var query = url.split('?')[1];
          var pairs = query.split("&");
          var args = {};
          for(var z = 0; z < pairs.length; z++){
            var pos = pairs[z].indexOf('=');
            if (pos == -1) continue;
            var name = pairs[z].substring(0,pos);
            var value = pairs[z].substring(pos+1);
            value = decodeURIComponent(value);
            args[name] = value;
          }
          self.videoList[i].embed_code = args.embed_code;
        }
        if ($(self.el).find('.mainPlayButton').is(':hidden') && $(self.el).find('.loadingContainer').is(':hidden')){
          console.log('parse video list - show play button');
          $(self.el).find('.mainPlayButton').show();
        }
    },
    
    getVideoList : function(){
      var feedUrl = this.global.settings.feedUrl;

      return $.ajax({
        url: feedUrl,
        type: "GET",
        headers: {
          'Content-Type': 'text/html'
        }
      });
    }
  }

  if (!window.globals){
    window.globals = {}
  }
  window.globals.videoList= videoList;
  window.globals.videoListSettings = settings;
  
})(jQuery);
