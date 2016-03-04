<?php
/**
 * Created by PhpStorm.
 * User: Administrator
 * Date: 2015/12/29
 * Time: 10:54
 */
header('Content-type: text/html; charset=utf-8');

$urls = array(
//    'http://shop.mogujie.com/detail/181h51g?acm=1.0.154.0rxpyVeB5iY.100.0.0-0&ptp=1.xktCZQLU._book_50047_pc-wall-v1_wall_docs.0.U9DaA'=>'3',
//    'http://item.jd.com/10039379250.html'=>'2',
//    'http://shop.mogujie.com/detail/18ghcv6?acm=1.0.154.0rxpyVeB5iY.100.0.0-2&ptp=1.xktCZQLU._book_50047_pc-wall-v1_wall_docs.2.U9DaA'=>'3',
//    'https://item.taobao.com/item.htm?spm=a219r.lm874.14.75.yidVJR&id=524500309321&ns=1&abbucket=1'=>'1',
//     'https://item.taobao.com/item.htm?spm=a219r.lm874.14.1.TKbTO0&id=524202177960&ns=1&abbucket=1'=>'1',
    'http://item.jd.com/1682990966.html'=>'2',

);


$name = array();
    foreach($urls as $k=>$v){
       array_push($name,array(
           'pt' =>$v,
           'listId' =>'1',
           'lanmu' =>'2',
           'publisher' =>'admin',
           'url' =>$k,
       ));
    }


$url = 'http://127.0.0.1:8888';
//echo curlPostContent($url,json_encode($name));


echo curlGetContent($url);

//POST获取数据
function curlPostContent($url, $post = 'a=1&b=2',  $header = array(), $timeout = 90){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);				//post数据
    curl_setopt($ch, CURLOPT_HEADER, 0);			//获得头
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);	//返回数据
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);			//超时时间 20
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION,1);		//跟踪301跳转
    if($post){
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    }
    if(!empty($header)){
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    }
    $return = curl_exec($ch);
    curl_close($ch);
    return $return;
}

//Get获取数据
function curlGetContent($url,  $header = array(), $timeout = 90,$tebie = false){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    if($tebie){
        curl_setopt($ch, CURLOPT_HEADER, 1);			//获得头
    }else{
        curl_setopt($ch, CURLOPT_HEADER, 0);			//获得头
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);	//返回数据
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0); // 对认证证书来源的检查
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 1); // 从证书中检查SSL加密算法是否存在
    curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);			//超时时间 20
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION,1);		//跟踪301跳转
    if($header){
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
    }
    $return = curl_exec($ch);
    curl_close($ch);
    return $return;
}

