/**
 * Created by Administrator on 2015/9/10.
 */
var resq = require('./module/request');
var http = require('http');
var url  = require("url");
var querystring = require("querystring");
var util = require('util');
var Func = require('./function.js');
var config = require('./config.js');
var tb = require('./caiji/cj_tb.js');
var jd = require('./caiji/cj_jd.js');
var mgj = require('./caiji/cj_mgj.js');

http.createServer(function (req, res) {
    req.setEncoding('utf-8');
    var postData = ""; //POST & GET ： name=zzl&email=zzl@sina.com
    req.addListener("data", function (postDataChunk) {
        postData += postDataChunk;
    });

    req.addListener("end", function () {
        //var params = querystring.parse(postData);//GET & POST  ////解释表单数据部分{name="zzl",email="zzl@sina.com"}

        DattaHandle(postData);

        res.writeHead(500, {
            "Content-Type": "text/plain;charset=utf-8"
        });
        res.end("数据提交完毕");
    });
}).listen(config.listen.prox, config.listen.host);
console.log('Server running at http://'+config.listen.host+':'+config.listen.prox+'/');

//数据处理
var DattaHandle = function(data){
    if((typeof data) == "string" && data !="" ){
        if(typeof JSON.parse(data) == "object")  new Data(data);
    }

}


//采集入口
var Data = function(arr){
    var params  = JSON.parse(arr);
  for(var i in params){
       switch (params[i]['pt']){
           case '1':new tb(params[i]);break;      //淘宝
           case '3':new jd(params[i]);break;      //京东
           case '5':new mgj(params[i]);break;     //蘑菇街
       }
    }
}



ipReport();
//采集机上报
var RepotTime  = 1000*1200;
//console.log(RepotTime);
setInterval(function(){ipReport()},RepotTime);

function ipReport(){
    var options = {
        url : 'http://'+config.listen.host+':'+config.listen.prox,
        method : 'GET',
        encoding: 'utf8'
    };

    resq(options, function(err, res, body) {
        if(body == "数据提交完毕"){
            var ip =  Func.getIp();
            if(!ip){
                console.log("没有获取到IP地址，采集机状态不能上报。");
                return;
            }
            var date = new Date().Format('yyyy-MM-dd hh:mm:ss');
            var prox = config.listen.prox;
            var localIP = '114.215.155.211';
            var version = '10';
            var Myquery = Func.DbMysql();
            var sql = "SELECT * FROM tbk_nodejs WHERE id='1'";
                Myquery.query(sql,function(err, result){
                    if(err) throw err;
                    if(result.length>0){
                       var sql1 = "UPDATE tbk_nodejs SET outside_ip='"+localIP+"',prox='"+prox+"',version='"+version+"',marking='"+ip+"',runtime='"+date+"' WHERE id=1";
                        Myquery.query(sql1,function(err, result){
                            if(err) throw err;
                        });
                    }else{
                        var sql2 ="INSERT INTO tbk_nodejs(outside_ip,prox,version,marking,runtime) VALUES ('"+localIP+"','"+prox+"','"+version+"','"+ip+"','"+date+"')";
                        Myquery.query(sql2,function(err, result){
                            if(err) throw err;
                        });
                    }
                    Myquery.end();
                });
        }
    });
}






