;(function ($) {
	'use strict'; //严格模式
	//item对象
	/**
	 * [Item description] 						账目对象
	 * @param {[type]} name   [description] 	标题
	 * @param {[type]} cat    [description]		分类
	 * @param {[type]} time   [description]		时间
	 * @param {[type]} type   [description]		类型
	 * @param {[type]} num    [description]		数值
	 * @param {[type]} remark [description]		详细
	 */
	function Item(index, title, cat, time, type, num, remark) {
		this.index = index; //数据的索引
		this.title = title;
		this.cat = cat;
		this.time = time;
		this.type = type;
		this.num = num;
		this.remark = remark;
	}

	/**
	 * [prototype description]
	 * @type {Object}
	 */
	Item.prototype = {
		renderItem: function() {	//渲染此条数据
			 var $li = this.createItemHtml();
     		 $li.appendTo('.item-list');
     		
		},

		createItemHtml: function() {	//创建此条item的html
			 var that = this; 
			 //console.log(this.type);
			 var context = {'index': this.index, 'title': this.title, 'num': '+' + this.num, 'type': this.type};
     		 // 借助模板引擎的API 渲染数据
     		 var html = template('item-tmpl', context);
     		 var $li = $(html);
     		 

     		 //绑定update 和 delete事件
     		 $li.on('click', '.item-del-btn', function () {	//删除item事件绑定
     		 	if(!confirm('确定删除元素')) return;
     		 	that.delItem();
     		 }).on('click', '.item-detail-btn', function () {	//查询详情事件绑定
     		 	that.showDetail();
     		 }).on('dblclick', function () {
     		 	alert('这是双击更新事件');
     		 });
     		 return $li;
		},

		updateItem: function(data) {	//更新数据
				var item = {};	
     		 	var dreg = /^[\d]+$/;	//判断是否都为数字的正则
     		 	$.each(data, function(i, v) {	//遍历表单值，为对象和数据库更新
     		 		if (dreg.test(v.value)) {	//判断是否为纯数字字符串
     		 			this[v.name] = parseInt(v.value);	//更新对象中的数据
     		 			item[v.name] = parseInt(v.value);
     		 		} else {
     		 			if (v.name == 'time') {	//判断是否为时间
     		 				this[v.name] = transTime(v.value);
     		 				item[v.name] = transTime(v.value); 
     		 				return;
     		 			}
     		 			this[v.name] = v.value;
     		 			item[v.name] = v.value;
     		 		}
     		 	}.bind(this));
     		 	items.itemList[this.index] = item;	//更新列表中的数据
     		 	store.set('itemList', items.itemList); //更新数据库中的数据
     		 	$('.item-list li[data-index='+ this.index +']').replaceWith(this.createItemHtml());
		},			

		delItem: function() {		//删除此条数据
			delete items.itemList[this.index];
			var tempList = $.extend(true, [], items.itemList); //创建一个临时数组复制这个数组
			tempList = tempList.filter(function (ele) {	//删除临时数组中的空元素
				return ele;
			});
			store.set('itemList', tempList); 	//在local中更新数据
			$('.item-list').find('li[data-index='+ this.index +']').remove();	//在页面删除这个元素
		},

		showDetail: function() {	//展示Item详细信息
			var context = {'index': this.index, 'title': this.title,
			'cat': this.cat, 'time': transTime(this.time), 'num': this.num, 'type': this.type,
			'remark': this.remark, 'cats': store.get('cats')};
     		 // 借助模板引擎的API 渲染数据
     		 var html = template('detail', context);
     		 var $detail = $(html);
     		 initTimeInput($detail.find('.datetime'));	//初始化时间input
     		 //判断是支出还是收入
     		 this.type ? $detail.find('.detail-type input:first').prop('checked', true) : $detail.find('.detail-type input:last').prop('checked', true);
     		 //设置分类的选中
     		 $detail.find('select').val(this.cat);
     		 //定位更新界面
     		 $detail.css({'position': 'absolute', 'right': 0, 'top': '-150px', 'zIndex':'1001'});
     		 $detail.appendTo('.item-list li[data-index='+ this.index +']');	
     		 //绑定增加分类事件
     		 onInsertCat($detail);     		 
     		 var that = this;
     		 //表单提交更新数据事件
     		 $detail.submit(function() {	
     		 	var data = $(this).serializeArray();	//获取表单的中的值
     		 	that.updateItem(data);	//调用对象更新行
     		 	$(this).remove();
     		 	$('.mask').hide();
     		 	return false;	//阻止游览器提交行为
     		 });

     		 //遮挡层
     		 $('.mask').show().css('background-color', 'rgba(0,0,0,0)').click(function () {
     		 	$('.detail').remove();
     		 	$(this).hide();
     		 });
		}
	}

	window.Item = Item;
}($));



;(function($){
	'use strict'
	//Items 构造函数
	function Items () {
		this.itemList = store.get('itemList');	//所有的账目列表
		this.itemObjs= [{'title': '我的名字啊',
'cat': 0,
'time': 1524787200000,
'type': 0,
'num': 10000,
'remark': '这是钱的定义啊'
},{'title': '我的名字啊111',
'cat': 1,
'time': 1524873600000,
'type': 1,
'num': 10000,
'remark': '这是钱的定义啊'
},{'title': '我的名字啊222',
'cat': 2,
'time': 1524960000000,
'type': 0,
'num': 10000,
'remark': '这是钱的定义啊'
}];		//页面上的item对象列表
	}

	Items.prototype = {
		renderItems: function(tempList) {	//渲染select的item，若没有参数就渲染所有
			this.itemObjs = [];		//清空item对象集合
			$('.item-list').empty();	//清空页面中的item盒子
			if (!tempList) {
				var tempList = this.itemList;
			}
			for (var i = 0; i < tempList.length; i++) {
				var itemObj = new Item(i, 
					tempList[i].title, 
					tempList[i].cat, 
					tempList[i].time, 
					tempList[i].type, 
					tempList[i].num, 
					tempList[i].remark);
				itemObj.renderItem();
				this.itemObjs.push(itemObj);
			}
			console.log(111);
			itemsAna.renderAnaPro();
		},

		insertItem: function(data) {	//添加item
			//console.log(data);
			var item = {};	
 		 	var dreg = /^[\d]+$/;	//判断是否都为数字的正则
 		 	$.each(data, function(i, v) {	//遍历表单值，为对象和数据库更新
 		 		if (dreg.test(v.value)) {	//判断是否为纯数字字符串
 		 			item[v.name] = parseInt(v.value);
 		 		} else {
 		 			if (v.name == 'time') { //是否为时间
 		 				item[v.name] = transTime(v.value);
 		 				return;
 		 			}
 		 			item[v.name] = v.value;
 		 		}
 		 	});
 		 	this.itemList.push(item);	//更新列表中的数据
 		 	store.set('itemList', this.itemList); //更新数据库中的数据
 		 	//创建这个新增加的item对象并添加到页首
 		 	var insertItemObj = new Item(store.get('itemList').length - 1, 
							item.title, 
							item.cat, 
							item.time, 
							item.type, 
							item.num, 
							item.remark);
 		 	this.itemObjs.push(insertItemObj);
			insertItemObj.createItemHtml().prependTo('.item-list');
		},

		selectItems: function(timeStart, timeEnd, cat) {	//查询item 开始时间，结束时间，分类
			var tempList = [];
			//判断时间和分类
			timeStart = timeStart ? timeStart : 0;
			timeEnd = timeEnd ? timeEnd : 9999999999999999;
			for (var i = 0; i < this.itemList.length; i++){
				var item = this.itemList[i];
				if (item.time >= timeStart && item.time <= timeEnd && ( cat == '9999' || item.cat == cat)) {
					tempList.push(item);
				}	
			}
			this.renderItems(tempList);	//渲染这些item
		}
	};
	window.Items = Items;
}($));


;(function ($) {
	'use strict'
	function ItemsAna() {

	};
	ItemsAna.prototype = {
		//渲染进度条
		renderAnaPro: function () {
			//alert(1);
			var income = 0;	//收入
			var expend = 0;	//支出
			$(items.itemObjs).each(function (i, item) {//计算收入和支出
				if (item.type) {
					income += item.num;
				} else {
					expend += item.num;
				}
			});
			//设置进度条长度 和 文字
			$('.ana-pro-left').css({
				'width': income/(income+expend)*100-0.5 + '%'
			}).text('收入: ' + income);
			$('.ana-pro-right').css({
				'width': expend/(income+expend)*100-0.5  + '%'
			}).text('支出: ' + expend);
		},
	};

	ItemsAna.prototype.constructor = ItemsAna;//重新指向构造函数
	window.ItemsAna = ItemsAna;
}($));