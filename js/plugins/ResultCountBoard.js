/*****************************************************************************

　ResultCountBoard.js
 
　[LICENSE]
 　Copyright (c) 2016 rasentaso
 　Released under the MIT license
 　http://opensource.org/licenses/mit-license.php

　[URL]
　 http ://rasentaso.blogspot.jp
 　https://twitter.com/rasentaso
 　https://github.com/rasentaso

　[HISTORY]
 　2016/5/2 Create
  
*******************************************************************************/

/*:ja
 * @plugindesc 過去にゲームをプレイした人の様々な実績を集計して表示する
 * @author rasentaso
 *
 * @param app_id
 * @desc milkcocoaから発行されるアプリケーションID
 * @default woodinjnda6q
 *
 * @help
 *
 * プラグインコマンド:
 *
 * add_title          標題ID 表示文字列
 * add_head           標題ID 見出しID 表示文字列　
 * add_paragraph      標題ID 見出しID 段落ID 表示文字列
 * increment          標題ID 見出しID 段落ID
 * show               標題ID 
 *
 */

(function() {
    
    //パラメータ取得
	var _param = PluginManager.parameters('ResultCountBoard');    
    var _app_id  = String(_param['app_id']) + '.mlkcca.com';
    
    var _ds_path = '';    

    //milkcocoa.jsの読み込み
    var url = 'https://cdn.mlkcca.com/v2.0.0/milkcocoa.js';;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = false;
    script.onerror = PluginManager.onError.bind(this);
    script._url = url;
    document.body.appendChild(script);

	//プラグインコマンド
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'ResultCountBoard') {

            //dataStoreはtitle_id毎に切り替える
            var title_id = String(args[1]);
            _ds_path = command + '/contents/' + title_id;

            var head_id       = 0;
            var paragraph_id  = 0;
            
            switch (args[0]) {
            case 'add_paragraph':　//段落追加
                paragraph_id  = Number(args[3]);       
            case 'add_head':　//見出し追加
                head_id       = Number(args[2]);                                            
            case 'add_title': //標題追加

                var caption       = args[args.length - 1];

                addContent(head_id,paragraph_id,caption);
                break;      
                    
            case 'increment':　//数量の加算     
                head_id       = Number(args[2]);
                paragraph_id  = Number(args[3]);                 
                incrementNumber(head_id,paragraph_id);
                break;
                    
            case 'show':　//画面表示
                SceneManager.push(Scene_ResultCountBoard);                    
                break;
            }
		}
    };
    
    //
    // DBにコンテンツを追加
    //
	function addContent(head_id, paragraph_id, caption ) {

        var key   = String(head_id) + '/' + String(paragraph_id);        
        var milkcocoa = new MilkCocoa(_app_id);
        var ds   = milkcocoa.dataStore(_ds_path);

        ds.get(key, function(err, datum) {            
            if(err !== null){
                //存在しない場合のみ追加する
                ds.set( key ,{
                              'head_id'        : head_id,
                              'paragraph_id'   : paragraph_id,            
                              'caption'        : caption,            
                              'number'         : 0
                            }, function(err, set){
                                //サーバに到達
                                console.log(set);
                                milkcocoa.disconnect();
                            }, function(err) {
                                milkcocoa.disconnect();            
                            });                                
            }else{
                milkcocoa.disconnect();
            }
        });

    }

    //
    // 既存コンテンツの数量を加算する
    //    
	function incrementNumber(head_id, paragraph_id) {

        var key   = String(head_id) + '/' + String(paragraph_id);                
        var milkcocoa = new MilkCocoa(_app_id);
        var ds   = milkcocoa.dataStore(_ds_path);

        ds.get(key, function(err, datum) {
            console.log(datum);
            datum.value.number++;
            console.log(datum.value.number);
            ds.set(key,datum.value,function(err, set){
                                console.log(set);
                                milkcocoa.disconnect();
                            }, function(err){
                                milkcocoa.disconnect();
                            });
        });
    }
    
    //-----------------------------------------------------------------------------
    // Scene_ResultCountBoard
    //
    // The scene class of the Window_ResultCountBoard screen.
    function Scene_ResultCountBoard() {
        this.initialize.apply(this, arguments);
    }
    Scene_ResultCountBoard.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_ResultCountBoard.prototype.constructor = Scene_ResultCountBoard;
    
    Scene_ResultCountBoard.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };

    Scene_ResultCountBoard.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);

        this.window_resultcountboard = new Window_ResultCountBoard();
        this.window_resultcountboard.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this.window_resultcountboard);        
        
    };
    
    //-----------------------------------------------------------------------------
    // Window_ResultCountBoard
    //
    // The window for displaying full status on the status screen.

    function Window_ResultCountBoard() {
        this.initialize.apply(this, arguments);
    }

    Window_ResultCountBoard.prototype = Object.create(Window_Selectable.prototype);
    Window_ResultCountBoard.prototype.constructor = Window_ResultCountBoard;

    Window_ResultCountBoard.prototype.initialize = function() {

        var width = Graphics.boxWidth;
        var height = Graphics.boxHeight;
        Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);
        this.refresh();
        this.activate();
        
    };

    Window_ResultCountBoard.prototype.refresh = function() {

        this.contents.clear();
    
        var milkcocoa = new MilkCocoa(_app_id);
        var ds   = milkcocoa.dataStore(_ds_path);  
        ds.stream().next(function(err, data) {
            data.sort(function(a,b) {
                if(a.value.head_id !== a.value.head_id){
                    return a.value.head_id < b.value.head_id ? -1 : 1;
                }
                if(a.value.paragraph_id !== a.value.paragraph_id){
                    return a.value.paragraph_id < b.value.paragraph_id ? -1 : 1;
                }
                return 0;
            });
            var lineHeight = this.lineHeight();
            this.drawText(data[0].value.caption, 0, 0, 512);
            this.drawHorzLine(36);

            for(var i = 1; i < data.length; i++){
                var text = data[i].value.caption + " " + String(data[i].value.number);
                this.drawText(text, 0, 20 + i * 36, 512);
            }

        }.bind(this));            

        
/*
        this.changeTextColor(this.hpColor(actor));
        this.drawText(actor.name(), x, y, width);        
        this.drawHorzLine(lineHeight * 1);
*/

    };

    Window_ResultCountBoard.prototype.drawBlock1 = function(y) {
        this.drawActorName(this._actor, 6, y);
        this.drawActorClass(this._actor, 192, y);
        this.drawActorNickname(this._actor, 432, y);
    };

    Window_ResultCountBoard.prototype.drawBlock2 = function(y) {
        this.drawActorFace(this._actor, 12, y);
        this.drawBasicInfo(204, y);
        this.drawExpInfo(456, y);
    };

    Window_ResultCountBoard.prototype.drawBlock3 = function(y) {
        this.drawParameters(48, y);
        this.drawEquipments(432, y);
    };

    Window_ResultCountBoard.prototype.drawBlock4 = function(y) {
        this.drawProfile(6, y);
    };

    Window_ResultCountBoard.prototype.drawHorzLine = function(y) {
        var lineY = y + this.lineHeight() / 2 - 1;
        this.contents.paintOpacity = 48;
        this.contents.fillRect(0, lineY, this.contentsWidth(), 2, this.lineColor());
        this.contents.paintOpacity = 255;
    };

    Window_ResultCountBoard.prototype.lineColor = function() {
        return this.normalColor();
    };

    Window_ResultCountBoard.prototype.drawBasicInfo = function(x, y) {
        var lineHeight = this.lineHeight();
        this.drawActorLevel(this._actor, x, y + lineHeight * 0);
        this.drawActorIcons(this._actor, x, y + lineHeight * 1);
        this.drawActorHp(this._actor, x, y + lineHeight * 2);
        this.drawActorMp(this._actor, x, y + lineHeight * 3);
    };

    Window_ResultCountBoard.prototype.drawParameters = function(x, y) {
        var lineHeight = this.lineHeight();
        for (var i = 0; i < 6; i++) {
            var paramId = i + 2;
            var y2 = y + lineHeight * i;
            this.changeTextColor(this.systemColor());
            this.drawText(TextManager.param(paramId), x, y2, 160);
            this.resetTextColor();
            this.drawText(this._actor.param(paramId), x + 160, y2, 60, 'right');
        }
    };

    Window_ResultCountBoard.prototype.drawExpInfo = function(x, y) {
        var lineHeight = this.lineHeight();
        var expTotal = TextManager.expTotal.format(TextManager.exp);
        var expNext = TextManager.expNext.format(TextManager.level);
        var value1 = this._actor.currentExp();
        var value2 = this._actor.nextRequiredExp();
        if (this._actor.isMaxLevel()) {
            value1 = '-------';
            value2 = '-------';
        }
        this.changeTextColor(this.systemColor());
        this.drawText(expTotal, x, y + lineHeight * 0, 270);
        this.drawText(expNext, x, y + lineHeight * 2, 270);
        this.resetTextColor();
        this.drawText(value1, x, y + lineHeight * 1, 270, 'right');
        this.drawText(value2, x, y + lineHeight * 3, 270, 'right');
    };

    Window_ResultCountBoard.prototype.drawEquipments = function(x, y) {
        var equips = this._actor.equips();
        var count = Math.min(equips.length, this.maxEquipmentLines());
        for (var i = 0; i < count; i++) {
            this.drawItemName(equips[i], x, y + this.lineHeight() * i);
        }
    };

    Window_ResultCountBoard.prototype.drawProfile = function(x, y) {
        this.drawTextEx(this._actor.profile(), x, y);
    };

    Window_ResultCountBoard.prototype.maxEquipmentLines = function() {
        return 6;
    };




    
})();