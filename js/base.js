'use strict'

//时间转换函数 当参数是字符串转换为时间戳 参数为数字转换为字符串
function transTime(time) {
	if (typeof time == 'string') {
		var date = new Date(time);
		return date.getTime();
	}
	var date = new Date(time);
	var year = date.getFullYear();
	var month = (date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1));
	var day = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate();
	return year + '-' + month + '-' + day;
}

// 表单验证函数
function checkFormData (data) {
	var dreg = /^[\d]+$/;
	var treg = /^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
	// 表单验证标志默认为正确
	var flag = true;
	$.each(data, function (i, v) {
		switch(data[i].name){
			case 'cat':	// 判断分类是否为数字， 9999是没有选择的默认值
				if (data[i].value == '9999' || !dreg.test(data[i].value)) {
					//console.log(111)
					flag = false;
				}
				break;
			case 'type':	// 判断账目类型是否为0或者1
				if (data[i].value != '1' && data[i].value != '0'){
					flag = false;
				}	
				break;
			case 'num':	// 判断金额是否为数字
				if (!dreg.test(data[i].value)) {
					flag = false;
				}
				break;
			case 'time':	// 判断时间格式是否正确
				if (!treg.test(data[i].value)) {
					flag = false;
				}
				break;
			default:
				break;
		}	
	})
	// 如果都验证通过返回正确
	return flag;
}

//初始化时间Input
function initTimeInput(ele) {
	ele.datetimepicker({	
		format:"Y-m-d",	//格式化事件
		timepicker:false	//取消时间选项
	});
}


//初始化页面中的时间控件
var $datetime = $(".datetime");
initTimeInput($datetime);
$.datetimepicker.setLocale('ch');	//语言选择中文


//搜索的初始化
//选中分类 初始化
$.each(store.get('cats'), function (i, cat) {
	$('<option value=' + i + '>' + cat + '</option>').appendTo('.search-type');
});

//选着一天，一月，所有的绑定事件
$('#one_day_time').on('click', function() {	//选择当天时间
	var date = new Date();
	$("#time_start").val(transTime(date.getTime()));
	$("#time_end").val(transTime(date.getTime())); 
	togTimesLotLi(this);
});

$('#one_month_time').on('click', function() {	//选择本月时间
	var date = new Date();
	var onMonth = transTime(date.getTime()).replace(/\d{2}$/,"01");	//替换字符串末尾两个数字为01
	$("#time_start").val(onMonth);
	$("#time_end").val(transTime(date.getTime())); 
	togTimesLotLi(this);
});

$('#all_time').on('click', function() {	//选择所有时间
	$("#time_start").val('****-**-**');
	$("#time_end").val('****-**-**'); 
	togTimesLotLi(this);
});

function togTimesLotLi(inp) {	//清除时间选择的类样式
	$('.search-timeslot>li>input').each(function (i, ele) {
		$(ele).removeClass('current');
	});
	$(inp).addClass('current');
}


//增加item点击事件
$('.insert-item').click(function () {
	var context = {'cats': store.get('cats')}; // 借助模板引擎的API 渲染数据
	context.T = '添加'
	var html = template('detail', context);
	var $detail = $(html);
	//初始化时间Input
	initTimeInput($detail.find('.datetime'));
	//定位到页面中央
	$detail.css({'position': 'fixed', 'left': '50%', 'top': '50px', 'margin-left': '-150px','zIndex':'1001'});
	//绑定增加分类事件函数
	onInsertCat($detail);
	$detail.appendTo('body');	
	//表单提交更新增加item事件
	$detail.submit(function(e) {
		e.preventDefault();	
		var data = $(this).serializeArray();	//获取表单的中的值
		items.insertItem(data);
		//that.updateItem(data);	//调用对象更新行
		$(this).remove();
		$('.mask').hide();
		//e.preventDefault();
		return false;	//阻止游览器提交行为
	});
	//遮挡层
	$('.mask').show().css('background-color', 'rgba(0,0,0,.3)').click(function () {
		$('.detail').remove();
		$(this).hide();
	});
});


//搜索按钮点击事件
$('#search_items').on('submit', function (e) {	//搜索表单提交事件
	var data = $(this).serializeArray();
	var timeStart = transTime(data[0].value);
	var timeEnd = transTime(data[1].value);
	var cat =  data[2].value;
	//e.preventDefault();
	items.selectItems(timeStart, timeEnd, cat);
	//console.log(timeStart, timeEnd, cat);
	return false;
});


//绑定增加分类函数
function onInsertCat ($detail) {
	$detail.on('click', '.detail-cat-btn1', function() {	//点击显示增加界面
	 	$(this).parent().hide().end().parent().next().show();
	 }).on('click', '.detail-cat-btn2', function() {
		 //更新数据中的cats
		var cat = $(this).prev().val().trim();
		if (cat == '') {	// 判断添加的分类是否为空
			alert('不能为空');
			return
		}
	 	var cats = (store.get('cats') || []).concat(cat);
	 	store.set('cats', cats);
	 	//更新界面中cats
	 	var html = '<option>选择分类:</option>';
	 	for(var i = 0; i < cats.length; i++){
	 		html += '<option value="' + i + '">' + cats[i] + '</option>';
		 }
	 	$(this).parent().prev().find('select').html(html);
	 	$(this).parent().hide().end().parent().prev().show();
	 });
}


// 资金分析统计的按钮点击事件
$('.ana-btn').on('click', function (e) {	//搜索表单提交事件
	$('canvas').show();
	itemsAna.initPie(items.itemObjs);
	//遮挡层
	$('.mask').show().css('background-color', 'rgba(0,0,0,.3)').click(function () {
		$('canvas').hide();
		$(this).hide();
	});
});


// 初始化账单列表对象 
// 进度条 统计图对象
var items = new Items();
var itemsAna = new ItemsAna();
// 渲染账单
items.renderItems();





// //datalist  存储item数据
// //title, cat, time, type, num, detail
// var data = [{'title': '我的名字啊',
// 'cat': 0,
// 'time': 1524787200000,
// 'type': 0,
// 'num': 10000,
// 'remark': '这是钱的定义啊'
// },{'title': '我的名字啊111',
// 'cat': 1,
// 'time': 1524873600000,
// 'type': 1,
// 'num': 10000,
// 'remark': '这是钱的定义啊'
// },{'title': '我的名字啊222',
// 'cat': 2,
// 'time': 1524960000000,
// 'type': 0,
// 'num': 10000,
// 'remark': '这是钱的定义啊'
// }];

// //store.set('itemList', data);
// //console.log(store.get('itemList'));
// var cats = ['one', 'two', 'three'];
// //store.set('cats', cats);

