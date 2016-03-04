/**
 * Created by Administrator on 2016/1/5.
 */
var http = require('../module/request');
var cheerio = require('../cheerio');
var iconv = require('../iconv-lite');
var Func = require('../function.js');
var config = require('../config.js');
var fs = require('fs');
var path = require('path');

function cj_mgj(Nesdata){
    var obj  = new Object();
        obj.url  = Nesdata.url;
        obj.listId = Nesdata.listId;
        obj.lanmu  = Nesdata.lanmu;
        obj.pt = Nesdata.pt;
        obj.publisher = Nesdata.publisher;
        try{
            obj.pid = obj.url.match(/detail\/(.*)\?/)[1];
        }catch(err){
            console.log('===>URL：'+obj.url+'==>匹配ID失败');
            return;
        }
        obj.mgj_self = this;
    console.log("==进入URL==>"+obj.url);

    var options = {
        url : obj.url,
        method : 'GET',
        encoding: 'binary',
        headers: {
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8', 'Cookie':'from_site=tieba.baidu.com%5E; _ga=GA1.2.1931278408.1448953103; FRMS_FINGERPRINT=130187374a5ff147c45601019576a233ee08431c1341e4da3b7fbbce2345139100000000000000001231217eedd1ba8c592d1271d3d9446802a44259126100000000000000001321b326b5062b2f0e691421000000000000000012216a5889bb0190d021141100000000000000001361000000000000000012416a5889bb0190d02112113a835d3215755c4313318f14e45fceea167a12511ff1de774005f8da009186dbd32fae09e5c61381b326b5062b2f0e691371dfa004ad8ed498721351e4da3b7fbbce23451401b326b5062b2f0e691311f48315ae970949d21291502f1bd97b0e7d80120125bfde53e714c6722b01ca73e8048e74e08c1281d3d9446802a44259; _OkLJ_%UJ=16HRMZ4ZB6P8CAFN; Hm_lvt_3621aca6d2e2da698daf02aba80964a9=1448963844,1449021440,1449021508,1449021557; Hm_lpvt_3621aca6d2e2da698daf02aba80964a9=1449021557; _ga=GA1.3.1931278408.1448953103; __mgjuuid=9cceb2b7-35cf-5f2a-6419-90632ff004ec; _mg_tk=ebf1abe414',
            'Host':'shop.mogujie.com',
            'accept-language':'zh-CN,zh;q=0.8',
            'User-Agent':'ozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36',
        }
    };

    http(options, function(err, res, body) {
        obj.mgj_self.DomHtml(body,obj,function(){

            //数据处理
            var myDate = new Date();
            obj.time  =  myDate.Format('yyyy-MM-dd hh:mm:ss');
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

cj_mgj.prototype.DomHtml = function(body,obj,callback){

    var body  = iconv.decode(new Buffer(body, 'binary'), 'utf8');
    var $  = cheerio.load(body);

    obj.title = $(".goods-title").text().Trim();
    obj.price = $("#J_NowPrice").text().Trim();
    obj.rate = $(".rate-num .num").text();

    obj.mgj_self.GetPic(body,obj,function(){
        obj.mgj_self.Args(obj,function(){
             callback();
        });
    });

}

cj_mgj.prototype.GetPic = function(body,obj,callback){
      var js_img = body.match(/\{"topImages"\:\[(.*?)\]/)[1];
          js_img = js_img.replace(/(")|(\\)/g,"");
      var arr  = js_img.split(",");
      var Pnum = arr.length;
      var img  = [];

      for(var i in arr){
          console.log("==正在下载图片==>"+arr[i]);
          obj.mgj_self.PicCreate(arr[i],obj,function(imgs){
              img.push(imgs);
              if(img.length == Pnum){
                  obj.img = img;
                  callback();
              }
          })
      }
}

//图片本地化
cj_mgj.prototype.PicCreate = function(tmp,obj,callback){
    var options = {
        url :tmp,
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

//参数,体会
cj_mgj.prototype.Args = function(obj,callback){
    var options = {
        url :'http://shop.mogujie.com/detailinfo/'+obj.pid+'?_ajax=1',
        method : 'GET',
        encoding: 'binary'
    };

    http(options, function(err, res, body) {
        var args_json = JSON.parse(body);
            obj.args  = args_json.result.parameter.datas;
            obj.tihui = args_json.result.itemDesc.desc;
            callback();
    });
}



module.exports = cj_mgj;