(function($){
   $.fn.dateRange = function(options)
   {
      var defaults = {selected: null, startWith: null, minimumDate: null, maximumDate: null};
      var opts = $.extend({}, defaults, options);
      var months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
      var abbreviations = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec');
      var daySelector = 'td:not(.m):not(:empty)';
      return this.each(function() 
      {
         if (this.dateRange) { return false; }
      
         var $input = $(this);
         var $container, selecting, selected, oldSelected, $prev, $next, $inputStart, $inputEnd;
         var self = 
         {
            initialize: function() 
            {
               $container = self.initializeContainer().hide();
               $prev = $container.find('div.prev').click(self.loadPrevious);
               $next = $container.find('div.next').click(self.loadNext);
               
               $inputStart = $container.find('.inputStart');
               $inputEnd = $container.find('.inputEnd');
               $inputStart.bind('blur', self.inputEntered);
               $inputEnd.bind('blur', self.inputEntered);
               
               $container.find('button.apply').click(self.applyButtonClicked);
               $container.find('button.cancel').click(self.cancelButtonClicked);
               $container.find('select.rangeDropdown').bind('change', self.rangeDropdownChanged);
               
               var now = new Date();
               now.setDate(1);
               var prev = new Date(now.getFullYear(), now.getMonth()-1, 1);
               $container.append(self.buildMonth(prev));
               $container.append(self.buildMonth(now));
               
               $input.click(function()
               {
                  self.show();
                  return false;
               }).keydown(function(e)
               {
                 if (e.keyCode == 13) { self.entered(); }
               });
               
               $(document).keydown(function(e)
               {
                  if (e.keyCode == 27) { self.hide(); }
               }).click(self.hide);
               
               $container.delegate(daySelector, 'click', self.clicked);
               $container.click(function(){return false;});
               
               if (opts.startWith != null)
               {
                 selected = opts.startWith;
                 oldSelected = selected;
                 self.rangeSelected();
                 self.updateGUIElements();
                 
                 // Make sure the main input shows the right value
                 $input.val(self.format(selected[0]) + ' - ' + self.format(selected[1]));
               }
            },
            entered: function()
            {
              var values = $input.val().split('-');
              if (values.length != 2) { return false; }
              
              var from = self.parseDate(values[0].replace(/^\s*/, '').replace(/\s*$/, ''));
              var to = self.parseDate(values[1].replace(/^\s*/, '').replace(/\s*$/, ''));
              if (from == null || to == null) { return false; }
              
              selected = [from, to];
              self.rangeSelected();
              self.updateGUIElements();
              return false;
            },
            parseDate: function(value)
            {
              return new Date(value);
            },
            show: function()
            {
               selecting = new Array();
               $container.show();
            },
            hide: function()
            {
               $container.hide();
            },
            clicked: function()
            {
               var $td = $(this).addClass('selected');
               var date = $td.closest('table').data('date');
               selecting.push(new Date(date.getFullYear(), date.getMonth(), $td.text()));
               if (selecting.length == 2)
               {
                  selected = selecting;
                  self.rangeSelected();
                  self.updateGUIElements();
               }
            },
            inputEntered: function(e) {
              e.preventDefault();
              var $t = $(this);
              var val = $t.val();
              selecting.push(new Date(val));
              if (selecting.length == 2) {
                selected = selecting;
                self.rangeSelected();
                self.updateGUIElements();
              }
            },
            rangeSelected: function()
            {
               if (selected[0] > selected[1])
               {
                  var x = selected[0];
                  selected[0] = selected[1];
                  selected[1] = x;
               }
               self.highlight($container.find('table:first'));
               self.highlight($container.find('table:last'));
               selecting = [];
               if (opts.selected != null) { opts.selected(selected); } 
            },
            updateGUIElements: function() {
              $inputStart.val(self.formatInput(selected[0]));
              $inputEnd.val(self.formatInput(selected[1]));
            },
            applyButtonClicked: function(e) {
              e.preventDefault();
              oldSelected = selected;
              $input.val(self.format(selected[0]) + ' - ' + self.format(selected[1]));
              self.hide();
            },
            cancelButtonClicked: function(e) {
              e.preventDefault();
              selected = oldSelected;
              self.rangeSelected();
              self.updateGUIElements();
              self.hide();
            },
            rangeDropdownChanged: function(e) {
              var option = $(this).find(':selected');
              selected = [];
              selected[0] = option.data('startdate');
              selected[1] = option.data('enddate');
              self.rangeSelected();
              self.updateGUIElements();
            },
            highlight: function($table)
            {
               if (selected == null || selected.length != 2) { return; }
               
               $table.find('td.highlight').removeClass('highlight');
               var startDate = $table.data('date');
               var endDate = new Date(startDate.getFullYear(), startDate.getMonth()+1, 0);
               if (startDate > selected[1] || endDate < selected[0]) { return; }
               
               var $tds = $table.find(daySelector);
               var start = selected[0].getMonth() < startDate.getMonth() || selected[0].getFullYear() < startDate.getFullYear() ? 0 : selected[0].getDate()-1;
               var end = selected[1].getMonth() > endDate.getMonth() || selected[1].getFullYear() > endDate.getFullYear() ? $tds.length : selected[1].getDate();
               for(var i = start; i < end; ++i)
               {
                  $tds.get(i).className = 'highlight';
               }               
            },
            loadPrevious: function()
            {               
               $container.children('table:eq(1)').remove();
               var date = $container.children('table:eq(0)').data('date');
               $container.find('div.nav').after(self.buildMonth(new Date(date.getFullYear(), date.getMonth()-1, 1)));
            },
            loadNext: function()
            {               
               $container.children('table:eq(0)').remove();
               var date = $container.children('table:eq(0)').data('date');
               $container.find('table').after(self.buildMonth(new Date(date.getFullYear(), date.getMonth()+1, 1)));            
            },
            initializeContainer: function()
            {
               $input.wrap($('<div>').addClass('calendarWrap'));
               var $container = $('<div>').addClass('calendar').insertAfter($input);
               var $nav = $('<div>').addClass('nav').appendTo($container);
               $nav.html('<div class="prev">&lsaquo;</div><div class="next">&rsaquo;</div>');
               
               var $sidebar = $('<div>').addClass('sidebar').appendTo($container);
               $sidebar.html(self.buildRangeDropdown());
               var $form = $('<form method="get" action="">').addClass('buttons').appendTo($sidebar);
               $('<input type="text" value="" class="inputStart" maxlength="10" /> - <input type="text" value="" class="inputEnd" maxlength="10" />').appendTo($form);
               $('<button class="cancel">Cancel</button><button type="submit" class="apply">Apply</button>').appendTo($form);
               return $container;
            },
            buildRangeDropdown: function() 
            {
              var date = new Date();
              var dates =  [
                {
                  text:  'Today',
                  value: 'today',
                  startdate: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                  enddate:   new Date(date.getFullYear(), date.getMonth(), date.getDate())
                },
                {
                  text:  'Yesterday',
                  value: 'yesterday',
                  startdate: new Date(date.getFullYear(), date.getMonth(), date.getDate()-1),
                  enddate:   new Date(date.getFullYear(), date.getMonth(), date.getDate()-1)
                },
                {
                  text:  'Last 7 days',
                  value: 'last7days',
                  startdate: new Date(date.getFullYear(), date.getMonth(), date.getDate()-7),
                  enddate:   new Date(date.getFullYear(), date.getMonth(), date.getDate())
                },
                {
                  text:  'Last 14 days',
                  value: 'last14days',
                  startdate: new Date(date.getFullYear(), date.getMonth(), date.getDate()-14),
                  enddate:   new Date(date.getFullYear(), date.getMonth(), date.getDate())
                },
                {
                  text:  'Last month',
                  value: 'lastmonth',
                  startdate: new Date(date.getFullYear(), date.getMonth()-1, date.getDate()),
                  enddate:   new Date(date.getFullYear(), date.getMonth(), date.getDate())
                }
              ];
              var $dropdown = $('<select>').addClass('rangeDropdown');
              $(dates).each(function() {
                var $option = $('<option>').val(this.value).text(this.text).data({startdate: this.startdate, enddate: this.enddate});
                $option.appendTo($dropdown);
              });
              return $dropdown;
            },
            buildMonth: function(date)
            {
               var first = new Date(date.getFullYear(), date.getMonth(), 1);
               var last = new Date(date.getFullYear(), date.getMonth()+1, 0);
               var firstDay = first.getDay();
               var totalDays = last.getDate();
               var weeks = Math.ceil((totalDays + firstDay) / 7);
               
               var table = document.createElement('table');

               
               for (var i = 0, count = 1; i < weeks; ++i)
               {
                  var row = table.insertRow(-1);
                  for(var j = 0; j < 7; ++j, ++count)
                  {
                     var cell = row.insertCell(-1);
                     if (count > firstDay && count <= totalDays+firstDay)
                     {
                        cell.innerHTML = count - firstDay;
                     }
                  }
               }
               
               var header = table.insertRow(0);
               var cell = header.insertCell(-1);
               cell.innerHTML = months[date.getMonth()] + ' ' + date.getFullYear();
               cell.className = 'm'; //very stupid IE (all versions) fix
               cell.colSpan = 7;
               
               var $table = $(table).data('date', date);
               self.highlight($table);
               
               if (opts.minimumDate && opts.minimumDate >= first) { $prev.hide() } else { $prev.show(); }
               if (opts.maximumDate && opts.maximumDate <= last) { $next.hide() } else { $next.show(); }
               
               return $table;
            },
            format: function(date)
            {
               return abbreviations[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
            },
            formatInput: function(date) {
              return date.getMonth()+1 + '/' + date.getDate() + '/' + date.getFullYear();
            }
         };
         this.dateRange = self;
         self.initialize();
      });
   }
})(jQuery);