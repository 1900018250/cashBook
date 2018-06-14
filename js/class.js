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
				// $('.item-list li[data-index='+ this.index +']').replaceWith(this.createItemHtml());
				$('#search_items').trigger('submit');	// 触发搜索
				// items.renderItems();	// 更新视图 
				// itemsAna.renderAnaPro();	// 更新进度条 
		},			

		delItem: function() {		//删除此条数据
			delete items.itemList[this.index];
			var tempList = $.extend(true, [], items.itemList); //创建一个临时数组复制这个数组
			tempList = tempList.filter(function (ele) {	//删除临时数组中的空元素
				return ele;
			});
			store.set('itemList', tempList); 	//在local中更新数据
			items.itemList = store.get('itemList');	//在这里更新一次数据 不然数组中有Unf
			$('.item-list').find('li[data-index='+ this.index +']').remove();	//在页面删除这个元素
			$('#search_items').trigger('submit');	// 触发搜索
			//items.renderItems();	// 更新视图 
			//itemsAna.renderAnaPro();	// 更新进度条
		},

		showDetail: function() {	//展示Item详细信息
			var context = {'index': this.index, 'title': this.title,
			'cat': this.cat, 'time': transTime(this.time), 'num': this.num, 'type': this.type,
			'remark': this.remark, 'cats': store.get('cats')};
			context.T = '更新';
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
		this.itemList = store.get('itemList') || [];	//所有的账目列表
		this.itemObjs= [];		//页面上的item对象列表
	}

	Items.prototype = {
		renderItems: function(tempList) {	//渲染select的item，若没有参数就渲染所有
			this.itemObjs = [];		//清空item对象集合
			$('.item-list').empty();	//清空页面中的item盒子
			if (!tempList) {
				var tempList = this.itemList;
			}
			for (var i = tempList.length - 1; i >= 0; i--) {
				var itemObj = new Item(i, 
					tempList[i].title, 
					tempList[i].cat, 
					tempList[i].time, 
					tempList[i].type, 
					tempList[i].num, 
					tempList[i].remark);
				itemObj.renderItem();
				this.itemObjs.unshift(itemObj);
			}
			itemsAna.renderAnaPro();
			// itemsAna.initPie(this.itemObjs)
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
			// insertItemObj.createItemHtml().prependTo('.item-list');
			// 这里不知道是不是应该要重置表单数据 
			// TODO
			this.renderItems();	//更新视图
			itemsAna.renderAnaPro();	// 更新进度条
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
	function ItemsAna(ctx) {
		this.ctx = ctx || $('canvas')[0].getContext('2d');
		//canvas的大小
		this.w = this.ctx.canvas.width;
		this.h = this.ctx.canvas.height;
		//圆的半径
		this.radius = 80;
		//线的长度
		this.outLine = 15;

		//收入与支出弧度
		this.inAngleList = [];	//收入弧度
		this.exAngleList = [];	//支出弧度

		//模拟数据
		this.data = [
			{"title":"第一次","type":1,"cat":3,"time":1525996800000,"num":411111,"remark":222},
			{"title":1231,"type":1,"cat":0,"time":1525996800000,"num":34343,"remark":1123123123},
			{"title":"啊啊","type":0,"cat":0,"time":1525996800000,"num":2323232,"remark":1111111111},
			{"title":12313,"type":0,"cat":1,"time":1525996800000,"num":111111,"remark":11},
			{"title":3123123,"type":1,"cat":0,"time":1525996800000,"num":22,"remark":1},
			{"title":23123,"type":0,"cat":0,"time":1525910400000,"num":11111,"remark":1},
			{"title":"收入啊","type":1,"cat":0,"time":1525996800000,"num":2320000,"remark":11},
			{"title":1111,"type":0,"cat":9999,"time":1526515200000,"num":2000000,"remark":146589},
			{"title":"买菜","type":0,"cat":0,"time":1526083200000,"num":123,"remark":23123123}];
	};
	ItemsAna.prototype = {
		//渲染进度条
		renderAnaPro: function () {
			//$('canvas').attr('height','400px');
		//	console.log(this.w + '===' + this.ctx.canvas.height + $('h1').outerWidth());
			
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

			// this.initPie(this.data);
		},



		//初始化饼状图
		initPie: function (data) {
			// 先清除画板
			this.ctx.clearRect(0, 0, 1000 ,1000)

			this.transformAngle(data);	// 获取需要画的弧度列表
			var cPointOne = {'x0': 180, 'y0': 145};
			var bgPointOne = {'x0': 10, 'y0': 10};	//Desc开始坐标
			var cPointTwo = {'x0': 460, 'y0': 145};
			var bgPointTwo = {'x0': 630, 'y0': 10};
			if($(window).width() < 640) {	//如果小于640px就做竖排输出
				$('canvas').attr('width', 320).attr('height', 500);
				this.w = this.ctx.canvas.width;
				this.h = this.ctx.canvas.height;
				cPointTwo = {'x0': 180, 'y0': 395};
				bgPointTwo = {'x0': 10, 'y0': 260};
			}
			this.drawPie(this.inAngleList, cPointOne, bgPointOne, true);
			this.drawPie(this.exAngleList, cPointTwo, bgPointTwo, false);
		},

		//绘制饼图
		drawPie: function (angleList, cPoint, bgPoint, flag) {
			var that = this;

			// 先绘制标题
			if(flag) {
				this.drawMain('2018-05-11', '2018-06-11收入', flag, cPoint);
			} else {
				this.drawMain('2018-05-11', '2018-06-11支出', flag, cPoint);
			}
			
			
			//开始弧度
			var startAngle = 0;
			$(angleList).each(function (i, item) {
				//当前结束的弧度等于下一次的开始弧度
				var endAngle = startAngle + item[0];
				that.ctx.beginPath();
				that.ctx.moveTo(cPoint.x0, cPoint.y0);
				that.ctx.arc(cPoint.x0, cPoint.y0, that.radius, startAngle, endAngle);
				//设置颜色 并记录
				var color = that.ctx.fillStyle = that.getRandomColor();
				that.ctx.fill();
				//绘制这一份的标题
				that.drawTitle(startAngle, item[0], color, item[1], cPoint);
				//绘制说明文档
				var descTitle = item[2] + '元';
				that.drawDesc(i, descTitle, bgPoint);
				startAngle = endAngle;
			});
		},

		//绘制时间与图的类型
		drawMain: function (timeStart, timeEnd, flag, cPoint) {
			this.ctx.beginPath();
			this.ctx.strokeStyle = this.getRandomColor();
			this.ctx.textAlign = 'center';
			this.ctx.textBaseline = 'top';
			this.ctx.font = '12px Microsoft YaHei';
			if(cPoint.y0 < 150) {
				this.ctx.fillText(timeStart + '~', cPoint.x0 ,0);
				this.ctx.fillText(timeEnd, cPoint.x0 ,16);
			} else {
				this.ctx.fillText(timeStart + '~', cPoint.x0 , cPoint.y0 - 145);
				this.ctx.fillText(timeEnd, cPoint.x0 , cPoint.y0 - 145 + 16);
			}
		},

		//绘制饼状图标题
		drawTitle: function(startAngle, angle, color, title, cPoint) {
			//从中心到外面的斜边
			var edge = this.radius + this.outLine;
			//斜边的x轴方长度
			var edgeX = Math.cos(startAngle + angle / 2) * edge;
			//斜边的y轴长度
			var edgeY = Math.sin(startAngle + angle / 2) * edge;
			//计算出去线末端的坐标
			var outX = cPoint.x0 + edgeX;
			var outY = cPoint.y0 + edgeY;
			//画出这个斜边
			this.ctx.beginPath();
			this.ctx.moveTo(cPoint.x0, cPoint.y0);
			this.ctx.lineTo(outX, outY);
			this.ctx.strokeStyle = color;

			//绘制拐点直线
			this.ctx.font = '12px Microsoft YaHei';
			//获取字的宽度
			var textWidth = this.ctx.measureText(title).width;
			if(outX > cPoint.x0){
				this.ctx.lineTo(outX + textWidth, outY);
				//设置字的方向
				this.ctx.textAlign = 'left';
			} else {
				this.ctx.lineTo(outX - textWidth, outY);
				//设置字的方向
				this.ctx.textAlign = 'right';
			}
			this.ctx.stroke();
			this.ctx.textBaseline = 'bottom';
			this.ctx.fillText(title, outX, outY);
		},

		//绘制说明文档
		drawDesc: function (index, title, bgPoint) {
			if (bgPoint.x0 < 320){
				this.ctx.fillRect(bgPoint.x0, bgPoint.y0 + index * (20), 20, 16);
				this.ctx.beginPath();
				this.ctx.textAlign = 'left';
				this.ctx.textBaseline = 'top';
				this.ctx.font = '12px Microsoft YaHei';
				this.ctx.fillText(title, bgPoint.x0 + 25 ,bgPoint.y0 + index * (20));
			} else {
				this.ctx.fillRect(bgPoint.x0, bgPoint.y0 + index * (20), -20, 16);
				this.ctx.beginPath();
				this.ctx.textAlign = 'right';
				this.ctx.textBaseline = 'top';
				this.ctx.font = '12px Microsoft YaHei';
				this.ctx.fillText(title, bgPoint.x0 - 25 ,bgPoint.y0 + index * (20));		
			}		
		},

		//把数据转换为弧度
		transformAngle: function (data) {
			// 先置空两个收入与支出弧度列表
			this.exAngleList = [];
			this.inAngleList = [];

			var income = 0;		//收入总和
			var expend = 0;		//支出总和
			var incomeList = {};	//收入列表
			var expendList = {};	//支出列表
			$(data).each(function (i, item) {	//遍历data得到收入总和，支出总和，收入分类列表 支出分类列表
				if(item.type){
					if (incomeList[item.cat]) {
						incomeList[item.cat] += item.num;
					} else {
						incomeList[item.cat] = item.num;
					}
					income += item.num;
				} else {
					if (expendList[item.cat]) {
						expendList[item.cat] += item.num;
					} else {
						expendList[item.cat] = item.num;
					}
					expend += item.num;
				}
			});
			for(var key in incomeList) {	//计算收入弧度
				var angle = incomeList[key] / income * Math.PI * 2;
				var cats = store.get('cats');
				this.inAngleList.push([angle, cats[key], incomeList[key]]);
			}

			for(var key in expendList) {	//计算支出弧度
				var angle = expendList[key] / expend * Math.PI * 2;
				var cats = store.get('cats');
				this.exAngleList.push([angle, cats[key], expendList[key]]);
			}
		},

		//获取随机颜色
		getRandomColor: function () {
			var r = Math.floor(Math.random() * 256);
			var g = Math.floor(Math.random() * 256);
			var b = Math.floor(Math.random() * 256);
			return 'rgb(' + r + ',' + g + ',' + b + ')';
		}
	};


	ItemsAna.prototype.constructor = ItemsAna;//重新指向构造函数
	window.ItemsAna = ItemsAna;
}($));