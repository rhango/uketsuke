// -*- Coding: utf-8-unix -*-

$(function(){
    var socket                  = io();
    var selected_mode           = $('#selected_mode');
    var playlist                = $('#playlist ol');
    var accordion               = $('#accordion');
    var accordion_status        = 'closed';
    var closed_accordion_height = '2.5em';
    var opened_accordion_height = window.innerHeight * 0.75 + 'px';
    var accordion_motion_time   = 500;

    socket.on('init_playlist_for_client', function(list_init){
        playlist.empty();
        var list = '';
        var length = list_init.length;
        list_init.forEach(function(msg, i){
            list = '<li><div class="mui-panel">'
                + (length - i)
                + '</div><div class="mui-panel">'
                + msg
                + '</div></li>'
                + list;
        });
        playlist.append(list);
    });

    socket.on('playlist_changed_to_client', function(msg, mode){
        switch(mode){
        case 'push':
            $('<li><div class="mui-panel">'
              + (playlist.children().length + 1)
              + '</div><div class="mui-panel">'
              + msg
              + '</div></li>')
                .prependTo(playlist);
                //.animate({height: '2.5em'}, 300)
                //.animate({left: 0}, 500);
            break;

        case 'unshift':
            list = playlist.children();
            length = list.length + 1;
            list.each(function(i, li){
                $(li).children().first().text(length - i);
            });
            $('<li><div class="mui-panel">'
              + 1
              + '</div><div class="mui-panel">'
              + msg
              + '</div></li>')
                .appendTo(playlist);
                //.animate({height: '2.5em'}, 300)
                //.animate({left: 0}, 500);
            break;

        case 'shift':
            list = playlist.children();
            length = list.length - 1;
            list.each(function(i, li){
                $(li).children().first().text(length - i);
            });
            list.last()
                //.animate({right: window.innerWidth + 'px'}, 300)
                //.animate({height: 0}, 100)
                .remove();
            break;
        }
    });

    $('#playlist button').on('click', function(){
        switch(accordion_status){
        case 'closed':
            accordion.animate({
                height: opened_accordion_height
            }, accordion_motion_time, 'ease');
            accordion_status = 'opened';
            break;

        case 'opened':
            accordion.animate({
                height: closed_accordion_height
            }, accordion_motion_time, 'ease');
            accordion_status = 'closed';
            break;
        }
    });

    $('#modes a').on('click', function(){
        selected_mode.attr('value', $(this).attr('value'));
        selected_mode.text($(this).text());
    });

    $('#messages button').on('click', function(){
        socket.emit('msg_from_client',
                    $(this).val(),
                    selected_mode.attr('value'));
    });
});
