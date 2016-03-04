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

function cj_jd(Nesdata){
    var obj  = new Object();
        obj.url  = Nesdata.url;
        obj.listId = Nesdata.listId;
        obj.lanmu  = Nesdata.lanmu;
        obj.pt = Nesdata.pt;
        obj.publisher = Nesdata.publisher;
        try{
            obj.pid = obj.url.match(/item\.jd\.com\/(.*?)\.html/)[1];
        }catch(err){
            console.log('===>URL：'+obj.url+'==>匹配ID失败');
            return;
        }
        obj.jd_self = this;
    console.log("==进入URL==>"+obj.url);

    var options = {
        url : obj.url,
        method : 'GET',
        encoding: 'binary',
        headers: {
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8', 'Cookie':'unpl=V2_ZzNtbUNWQEdyXUQGLEtUAWIKFQhLXxRBdQhPXHgaVAxmARFaclRCFXEURldnGl8UZwUZWUtcRxdFCHZRS2lcBGYAElVLUkUlRQhPZHMpVANuARNfRVFLJUUPdmRLHlkCYgYTXEtnQiV0; mt_subsite=||72%2C1450778333; __jda=122270672.978303679.1450778332.1450778336.1451375350.2; __jdc=122270672; __jdv=122270672|baidu|-|organic|not set; ipLocation=%u5317%u4EAC; areaId=1; ipLoc-djd=1-72-2799-0; __jdu=978303679',
            'Host':'item.jd.com',
            'accept-language':'zh-CN,zh;q=0.8',
            'User-Agent':'ozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36',
        }
    };

    http(options, function(err, res, body) {
        obj.jd_self.DomHtml(body,obj,function(){

            //数据处理
            var myDate = new Date();
            obj.time  =  myDate.Format('yyyy-MM-dd hh:mm:ss');
            obj.tihui = '';
            obj.tese  = '';
            for(var i = 0;i<3;i++){
                var temp = Math.round(Math.random()*(obj.args.length-1));
                var dat = (obj.args[temp]).split('：');
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

cj_jd.prototype.DomHtml = function(body,obj,callback){
    var body  = iconv.decode(new Buffer(body, 'binary'), 'gbk');
    var $  = cheerio.load(body);

    var title = $("#name h1").text().Trim();
        obj.title = title;
    var args = [];
    $(".p-parameter-list li").each(function(){
            args.push($(this).text());
    });
    args.shift(0);
    args.shift(0);
    obj.args = args;

    obj.jd_self.GetPic(obj,$,function(){
        obj.jd_self.Price(obj,function(){
            obj.jd_self.rate(obj,function(){
              callback();
            });
        })
    })

}

cj_jd.prototype.GetPic = function(obj,$,callback){
    var Pnum = $(".spec-items img").length;
    var img = [];
    $('.spec-items img').each(function(i,e){
        var tmp = $(this).attr('data-url');
        console.log("==正在下载图片==>"+tmp);
        obj.jd_self.PicCreate(tmp,obj,function(imgs){
            img.push(imgs);
            if(img.length == Pnum){
                obj.img = img
                callback();
            }
        });
    });
}

//图片本地化
cj_jd.prototype.PicCreate = function(tmp,obj,callback){
    var options = {
        url : 'http://img11.360buyimg.com/n1/'+tmp,
        method : 'GET',
        encoding: 'binary'
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

//价格
cj_jd.prototype.Price = function(obj,callback){
    var options = {
        url : 'http://p.3.cn/prices/get?skuid=J_'+obj.pid,
        method : 'GET',
        encoding: 'binary'
    };

    http(options, function(err, res, body) {
        var body = iconv.decode(new Buffer(body, 'binary'), 'gbk');
            obj.price = body.match(/\"p\"\:\"(.*)\"\,/)[1];
            callback();
    });
}
//评论
cj_jd.prototype.rate = function(obj,callback){
    var options = {
        url : 'http://club.jd.com/clubservice.aspx?method=GetCommentsCount&referenceIds='+obj.pid,
        method : 'GET',
        encoding: 'binary'
    };

    http(options, function(err, res, body) {
        var body = iconv.decode(new Buffer(body, 'binary'), 'gbk');
        obj.rate = JSON.parse(body).CommentsCount[0].CommentCount;
        callback();
    });
}

module.exports = cj_jd;