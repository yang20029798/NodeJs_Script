/**
 * Created by Administrator on 2015/12/29.
 */
var http = require('../module/request');
var cheerio = require('../cheerio');
var iconv = require('../iconv-lite');
var Func = require('../function.js');
var config = require('../config.js');
var fs = require('fs');
var path = require('path');

function cj_tb(Nesdata){
    var obj  = new Object();
        obj.url = Nesdata.url;
        obj.listId = Nesdata.listId;
        obj.lanmu  = Nesdata.lanmu;
        obj.pt = Nesdata.pt;
        obj.publisher = Nesdata.publisher;
    var tmp = obj.url.match(/\&id=(\d+)/);
        tmp = tmp !=null?tmp:obj.url.match(/\?id=(\d+)/);
      try{
          obj.pid = tmp[1];
      }catch(err){
          console.log('===>URL：'+obj.url+'==>匹配ID失败');
          return;
      }
        obj.tb_self = this;
    console.log("==进入URL==>"+obj.url);

    //主页面
    var options = {
        url : obj.url,
        method : 'GET',
        encoding: 'binary',
        headers: {
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cookie':'thw=cn; cna=vsfeDv8N7j0CAatYpJh+9ODs; x=e%3D1%26p%3D*%26s%3D0%26c%3D0%26f%3D0%26g%3D0%26t%3D0; _cc_=VT5L2FSpdA%3D%3D; tg=0; uc3=nk2=&id2=&lg2=; tracknick=; mt=ci=0_0; v=0; cookie2=1ca17f2c5fa95ffa42468ed0fb51f07b; t=9d319df831c382f9f81176f3398ff892; _tb_token_=3eee13374ba76; l=Al5e4h3FK8H/j2sPB9QsE/ZrLvqgHyKZ; isg=8239EF32D0CC5856BFF79CFE4451C60E',
            'Host':'item.taobao.com',
            'accept-language':'zh-CN,zh;q=0.8',
            'User-Agent':'ozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36',
        }
    };

    http(options, function(err, res, body){
        obj.tb_self.DomHtml(body,obj,function(){

            //数据处理
            var myDate = new Date();
            obj.time  =  myDate.Format('yyyy-MM-dd hh:mm:ss');
            obj.tihui = '';
            obj.tese  = '';
            for(var i = 0;i<3;i++){
                var temp = Math.round(Math.random()*(obj.args.length-1));
                var dat = (obj.args[temp]).split(':');
                dat = dat[1].replace(/\s+/,"");
                obj.tese += dat+'|';
            }
            obj.args = obj.args.join('|');

            //入库
            Func.CjMysqlIn(obj);
            console.log(obj);

        });
    });
}

cj_tb.prototype.DomHtml = function(body,obj,callback){
    var body  = iconv.decode(new Buffer(body, 'binary'), 'gbk');
    var $  = cheerio.load(body);

    var title = $('.tb-main-title').text();
        obj.title = title.Trim();
    var args = [];
    $('.attributes-list li').each(function(i, elem){
           args.push($(this).text());
    });
       obj.args = args;

    obj.tb_self.GetPic(obj,$,function(){
        obj.tb_self.price(obj,function(){
            obj.tb_self.rate(obj,function(){
                callback();
            });
        });
    });

}

//价格
cj_tb.prototype.price = function(obj,callback){
    var options = {
        url : 'https://detailskip.taobao.com/json/sib.htm?itemId='+obj.pid+'&p=1',
        method : 'GET',
        encoding: 'binary',
        headers: {
            'host':'detailskip.taobao.com',
            'accept':'*/*',
            'accept-language':'zh-CN,zh;q=0.8',
            'cookie':'thw=cn; cna=vsfeDv8N7j0CAatYpJh+9ODs; x=e%3D1%26p%3D*%26s%3D0%26c%3D0%26f%3D0%26g%3D0%26t%3D0; _cc_=VT5L2FSpdA%3D%3D; tg=0; uc3=nk2=&id2=&lg2=; tracknick=; mt=ci=0_0; v=0; cookie2=1ca17f2c5fa95ffa42468ed0fb51f07b; t=9d319df831c382f9f81176f3398ff892; _tb_token_=3eee13374ba76; l=Al5e4h3FK8H/j2sPB9QsE/ZrLvqgHyKZ; isg=8239EF32D0CC5856BFF79CFE4451C60E',
            'user-agent':'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36',
            'referer':obj.url,
        }
    };

    http(options, function(err, res, body) {
        var body = iconv.decode(new Buffer(body, 'binary'), 'gbk');
        var price = body.match(/price\:\"(.*?)\"\,/);
            price = price != null?price:body.match(/Price=\"(.*?)\"/);
        obj.price = price[1];
        callback();
    });
}

//图片本地化
cj_tb.prototype.PicCreate = function(tmp,obj,callback){
    var options = {
        url : 'http://'+tmp,
        method : 'GET',
        encoding: 'binary',
    };

    http(options, function(err, res, body) {
            var myDate = new Date();
            var file = myDate.getFullYear()+'/'+myDate.getmonth()+'/'+myDate.getday();
            var filename = config.photo+file;
            Func.mkdirsSync(filename);
            var picname = myDate.getTime()+'.jpg';
            fs.writeFile(filename+'/'+picname,body,'binary',function(err){
                if(err) return err;
                callback('images/photo/'+file+'/'+picname);
            });
    });

}
cj_tb.prototype.GetPic = function(obj,$,callback){
    var Pnum = $('.tb-thumb a img').length;
    var img = [];

    $('.tb-thumb a img').each(function(i,e){
        var tmp = $(this).attr('data-src').replace(/(\/\/)|(\.jpg_50x50)/g,"");
        console.log("==正在下载图片==>"+tmp);

        obj.tb_self.PicCreate(tmp,obj,function(imgs){
            img.push(imgs);
            if(img.length == Pnum){
                obj.img = img
                callback();
            }
        });
    });
}

//评论
cj_tb.prototype.rate = function(obj,callback){
    var options = {
        url : 'https://count.taobao.com/counter3?callback=jsonp121&keys=ICE_3_feedcount-'+obj.pid,
        method : 'GET',
        encoding: 'binary',
    };
    http(options, function(err, res, body) {
        var body = iconv.decode(new Buffer(body, 'binary'), 'gbk');
        var arr = body.match(/\:(\d+?)\}\)\;/)[1];
        obj.rate = arr;
        callback();
    });
}


module.exports = cj_tb;