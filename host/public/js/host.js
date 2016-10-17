$(function(){
    var socket             = io();
    var audios             = $('#audios audio');
    var audio_dict         = {};
    var eye_list           = [];
    var eye_motion_delay   = 150;
    var eye_motion_rate    = 0.03;
    var mouth_list         = [];
    var mouth_motion_delay = 150;
    var playlist           = { list: [], max_length: 10 };
    var player_is_free     = true;

    /*****************************
      define & init & setting
    *****************************/

    (function make_audio_dict(){
        audios.each(function(){
            var name = $(this).attr('name');
            audio_dict[name] = this;
        });
    })();

    (function make_eye_list(){
        eyes = $('#yukkuri .eye');
        eye_list.length = eyes.length;
        eyes.each(function(){
            var index = Number($(this).data('index'));
            eye_list[index] = this;
        });
    })();

    (function make_mouth_list(){
        mouthes = $('#yukkuri .mouth');
        mouth_list.length = mouthes.length;
        mouthes.each(function(){
            var index = Number($(this).data('index'));
            mouth_list[index] = this;
        });
    })();

    playlist.push = function(audio_name){
        var list = this.list;
        if(list.length < this.max_length){
            list.push(audio_name);
            socket.emit('playlist_changed_from_host', audio_name, 'push');
        }
    }

    playlist.unshift = function(audio_name){
        var list = this.list;
        if(list.length < this.max_length){
            list.unshift(audio_name);
            socket.emit('playlist_changed_from_host',
                        audio_name,
                        'unshift');
        }
    }

    playlist.shift = function(){
        var audio_name = this.list.shift();
        if(audio_name){
            socket.emit('playlist_changed_from_host', audio_name, 'shift');
            return audio_name;
        }else{
            return null;
        }
    }

    function play_audio(){
        var audio_name = playlist.shift();
        if(audio_name){
            var audio = audio_dict[audio_name];
            audio.currentTime = 0;
            audio.play();
        }else{
            player_is_free = true;
        }
    }

    function stop_audio(){
        audios.each(function(){
            this.pause();
        });
    }

    audios.on('ended', function(){
        play_audio();
    });

    /*****************************
      main program
    *****************************/

    (function move_eye(index, grad){
        setTimeout(function(){
            (function(){
                switch(index){
                case 0:
                    if(Math.random() > eye_motion_rate) return;
                    grad = 1;
                    break;
                case eye_list.length - 1:
                    grad = -1;
                    break;
                }
                $(eye_list[index]).css('z-index', '-1');
                index += grad;
                $(eye_list[index]).css('z-index', '0');
            })();
            move_eye(index, grad);
        }, eye_motion_delay);
    })(0, 1);

    (function move_mouth(index, grad){
        setTimeout(function(){
            (function(){
                switch(index){
                case 0:
                    if(player_is_free) return;
                    grad = 1;
                    break;
                case mouth_list.length - 1:
                    grad = -1;
                    break;
                }
                $(mouth_list[index]).css('z-index', '-1');
                index += grad;
                $(mouth_list[index]).css('z-index', '0');
            })();
            move_mouth(index, grad);
        }, mouth_motion_delay);
    })(0, 1);

    socket.on('msg_to_host', function(msg, mode){
        switch(mode){
        case 'push':
            playlist.push(msg);
            if(player_is_free){
                player_is_free = false;
                play_audio();
            }
            break;

        case 'unshift':
            playlist.unshift(msg);
            if(player_is_free){
                player_is_free = false;
                play_audio();
            }
            break;

        case 'interrupt':
            stop_audio();
            playlist.unshift(msg);
            if(player_is_free){
                player_is_free = false;
            }
            play_audio();
            break;
        }
    });
});
