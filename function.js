/**
 * Created by Administrator on 2015/12/30.
 */
var http = require("http");
var fs = require('fs');
var path = require('path');
var mysql = require('./module/mysql');
var os = require('os');
var ifaces = os.networkInterfaces();

String.prototype.Trim = function()
{
    return this.replace(/(^\s*)|(\s*$)/g, "");
}


/**
 * 时间格式化  继承Date
 * @returns {number}
 */
Date.prototype.getmonth = function(){
    var date = new Date();
    var month = date.getMonth()+1;
    if(month<10){
        month = '0'+month;
    }
    return month;
};

Date.prototype.getday = function(){
    var date = new Date();
    var day = date.getDate();
    if(day<10){
        day = '0'+day;
    }
    return day;
}

Date.prototype.TimeForm = function(){
    var date = new Date();
    var full = date.getFullYear()+'-'+date.getmonth()+'-'+date.getday()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
    return full;
}

Date.prototype.Format = function(fmt)
{
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}

/**
 * 函数库
 *
 * @constructor
 */
function Functions(){

    this.getpicdown = function(url, callback){
        http.get(url, function(res) {
            var data = "";
            res.setEncoding('binary');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on("end", function() {
                callback(data);
            });
        }).on("error", function() {
            callback(null);
        });
    }


    /**
     * 同步创建文件
     * @param dirpath
     * @param mode
     * @returns {boolean}
     */
    this.mkdirsSync = function(dirpath, mode) {
        if (!fs.existsSync(dirpath)) {
            var pathtmp;
            dirpath.split('/').forEach(function(dirname) {
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }
            });
        }
        return true;
    }


    /**
     * 本地Mysql连接
     * @constructor
     */
    this.DbMysql = function(){
        var TEST_DATABASE = 'tbk_m';
        //创建连接
        var client = mysql.createConnection({
            user: 'root',
            password: '',
            host:'localhost',
        });
        client.connect();
        client.query("use " + TEST_DATABASE);
        return client;
    }



    /**
     * 采集入库函数
     * @param obj
     * @constructor
     */
    this.CjMysqlIn = function(obj){
        //基本信息入库
        var Myquery = this.DbMysql();
        var sql = "INSERT INTO tbk_shop(sh_name,sh_fm,sh_price,sh_tese,sh_maidian,sh_tihui,sh_site,sh_url,sh_lanmu,sh_publisher,sh_pubtime,sh_caiji) VALUES ('"+obj.title+"','"+obj.img[0]+"','"+obj.price+"','"+obj.tese+"','"+obj.args+"','"+obj.tihui+"','"+obj.pt+"','"+obj.url+"','"+obj.lanmu+"','"+obj.publisher+"','"+obj.time+"','"+obj.listId+"')";

        Myquery.query(sql,function(err, result){
            if(err) throw err;
            //图片入库
            obj.InserId = result.insertId;
            for(var i in obj.img){
                var Sql = "INSERT INTO tbk_shpic(sh_id,picture) VALUES ('"+obj.InserId+"','"+obj.img[i]+"')";
                Myquery.query(Sql,function(err, result){
                    if(err) throw err;
                });
            }
            //任务状态
            var sql1 = "UPDATE tbk_caiji_list SET cj_stutas=2,cj_oprate_time='"+obj.time+"' WHERE id="+obj.listId+"";
            Myquery.query(sql1,function(err,result){
                if(err) throw err;

                //采集日志
                var date = new Date().Format('yyyy-MM-dd');
                var type = '1';
                var sql2 = "SELECT caiji_num,id FROM tbk_caiji_num WHERE caiji_time='"+date+"' AND caiji_type='"+type+"'";
                Myquery.query(sql2,function(err,result){
                    if(err) throw err;
                    if(result.length>0){
                        var res = result[0].caiji_num;
                        res += 1;
                        var id  = result[0].id;
                        var sql3 = "UPDATE tbk_caiji_num SET caiji_num='"+res+"' WHERE id='"+id+"'";
                        Myquery.query(sql3,function(err,result){
                            if(err) throw err;
                            Myquery.end();
                        });
                    }else{
                        var res = 1;
                        var sql4 = "INSERT INTO tbk_caiji_num(caiji_time,caiji_num,caiji_type) VALUES ('"+date+"','"+res+"','"+type+"')";
                        Myquery.query(sql4,function(err,result){
                            if(err) throw err;
                            Myquery.end();
                        });
                    }
                });
            });

            console.log("==入库表tbk_shop==>ID "+obj.InserId);
        });
    }


    /**
     * 获取IP
     * @returns {string}
     */
    this.getIp = function(){
        for(var i in ifaces){
            for(var j in ifaces[i]){
                if(ifaces[i][j].internal == false){
                    return ifaces[i][j].address + " " + os.hostname();
                    break;
                }
            }
        }
    };



    /**
     * 获取真实（外网）IP
     * @returns {*}
     */
    this.getLocalIP = function(){
        for (var dev in ifaces) {
            if( dev.indexOf('eth') != -1 ){
                var details = ifaces[dev][0];
                if ( details.family == 'IPv4' ) {
                    var ip = details.address;
                    if( ip.indexOf('10.') == 0 ||
                        ip.indexOf('172.') == 0 ||
                        ip.indexOf('192.') == 0 ){
                    }else{
                        return ip;
                        break ;
                    }
                }
            }
        }
    };


}

module.exports = new Functions();


