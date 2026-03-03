import bcrypt from 'bcryptjs';
import { initDb, createUser, createCourse, createLesson, getDb, saveDb } from './db/index.js';

async function seed() {
  await initDb();
  const db = getDb();
  
  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);
  const existingUser = db.exec("SELECT * FROM users WHERE email = 'demo@omnilearn.app'");
  
  if (!existingUser.length || !existingUser[0].values.length) {
    createUser('demo@omnilearn.app', passwordHash, 'CS Learner');
    console.log('✅ Demo user created');
  } else {
    console.log('✅ Demo user already exists');
  }
  
  // Create demo courses
  const existingCourses = db.exec("SELECT * FROM courses WHERE id = 1");
  if (!existingCourses.length || !existingCourses[0].values.length) {
    const courseId1 = createCourse('CPU 指令周期 (Fetch-Decode-Execute)', '深入计算机的心脏，直观感受控制单元、算术逻辑单元和内存是如何协同工作的。', 'computer-science', 1);
    createLesson(Number(courseId1), '取指阶段 (Fetch)', 'CPU 从内存中读取指令', 'diagram', JSON.stringify({ steps: [{ phase: 'Fetch', desc: '从内存读取指令' }] }), 0);
    createLesson(Number(courseId1), '译码阶段 (Decode)', '控制单元解析指令', 'diagram', JSON.stringify({ steps: [{ phase: 'Decode', desc: '解析指令' }] }), 1);
    createLesson(Number(courseId1), '执行阶段 (Execute)', 'ALU 执行计算', 'interactive', JSON.stringify({ interactions: [] }), 2);
    console.log('✅ Demo courses created');
  } else {
    console.log('✅ Demo courses already exist');
  }

  // Create Python course - 从零开始学Python
  const existingPython = db.exec("SELECT * FROM courses WHERE title = '从零开始学Python'");
  if (!existingPython.length || !existingPython[0].values.length) {
    const pythonCourseId = createCourse(
      '从零开始学Python',
      '真正从零开始，一点一点学会Python编程。没有基础？没关系！这门课就是为你准备的。',
      'programming',
      1
    );
    const pid = Number(pythonCourseId);

    // Lesson 1: 什么是编程？
    createLesson(pid, '第1课：什么是编程？', '了解编程到底是什么，为什么我们要学习编程', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是编程？' },
        { type: 'text', content: '编程就像给计算机写一本说明书。你告诉计算机："帮我做这个"、"帮我做那个"，计算机就会按照你的指示去执行。' },
        { type: 'text', content: '举个例子：想象你要教一个外国人用中文打招呼。你需要一步步告诉他：先说"你好"，然后说"我叫XXX"。编程也是一样的道理——你需要一步步告诉计算机要做什么。' },
        { type: 'text', content: '为什么学Python？因为Python是 最接近人类语言的编程语言，特别适合初学者。它可以用来做网站、游戏、数据分析、人工智能...等等太多了！' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: 'Python是一种简单易学的编程语言' },
        { type: 'text', content: '• 学会编程可以做很多事情！' }
      ]
    }), 0);

    // Lesson 2: 安装Python
    createLesson(pid, '第2课：安装Python', '在电脑上安装Python运行环境', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '安装Python' },
        { type: 'text', content: '在开始编程之前，我们需要先安装Python。Python是一个软件，就像你需要安装微信才能聊天一样。' },
        { type: 'heading', content: 'Windows系统安装步骤：' },
        { type: 'text', content: '1. 打开浏览器，访问 python.org' },
        { type: 'text', content: '2. 点击"Downloads"，选择Windows版本' },
        { type: 'text', content: '3. 下载安装包（大约25MB）' },
        { type: 'text', content: '4. 运行安装包，记得勾选"Add Python to PATH"' },
        { type: 'text', content: '5. 点击"Install Now"等待安装完成' },
        { type: 'heading', content: 'Mac系统安装步骤：' },
        { type: 'text', content: 'Mac系统通常已经预装了Python。如果没有，打开"终端"输入：brew install python3' },
        { type: 'heading', content: '验证安装：' },
        { type: 'text', content: '安装完成后，打开命令行（Windows叫CMD或PowerShell，Mac叫终端），输入：python --version' },
        { type: 'text', content: '如果显示类似"Python 3.x.x"的版本号，说明安装成功了！' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 从python.org下载安装包' },
        { type: 'text', content: '• 一定要勾选Add Python to PATH' },
        { type: 'text', content: '• 用python --version验证安装' }
      ]
    }), 1);

    // Lesson 3: 第一个程序
    createLesson(pid, '第3课：第一个程序Hello World', '写出生平第一个程序', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: 'Hello World！' },
        { type: 'text', content: '每个程序员学习的第一个程序都是输出"Hello World"。这就像是一个仪式，标志着我们正式踏入编程的大门！' },
        { type: 'heading', content: '开始我们的第一个程序：' },
        { type: 'text', content: '1. 打开记事本（Windows）或文本编辑器（Mac）' },
        { type: 'text', content: '2. 输入以下代码：' },
        { type: 'code', content: 'print("Hello World")' },
        { type: 'text', content: '3. 保存文件，命名为hello.py（注意后缀是.py不是.txt）' },
        { type: 'text', content: '4. 打开命令行，进入文件所在目录' },
        { type: 'text', content: '5. 输入：python hello.py' },
        { type: 'text', content: '6. 看！屏幕上显示出了"Hello World"！' },
        { type: 'heading', content: 'print()是什么？' },
        { type: 'text', content: 'print是Python的一个"函数"，它的作用是把括号里的内容显示到屏幕上。单引号或双引号告诉Python：这是文本，不是代码。' },
        { type: 'divider' },
        { type: 'heading', content: '🎉 恭喜！你已经写出了第一个程序！' },
        { type: 'text', content: '• print()用于输出内容到屏幕' },
        { type: 'text', content: '• 文本需要用引号包围' },
        { type: 'text', content: '• 文件名以.py结尾' }
      ]
    }), 2);

    // Lesson 4: 变量
    createLesson(pid, '第4课：变量 - 给数据起个名字', '学会使用变量存储数据', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是变量？' },
        { type: 'text', content: '变量就像是一个盒子，我们可以把数据放进去，给它贴个标签，以后需要的时候再拿出来用。' },
        { type: 'heading', content: '创建变量：' },
        { type: 'code', content: '# 这是一个变量\nname = "小明"\nage = 18\nprint(name)\nprint(age)' },
        { type: 'text', content: '运行结果：\n小明\n18' },
        { type: 'heading', content: '变量的命名规则：' },
        { type: 'text', content: '• 变量名只能包含字母、数字、下划线' },
        { type: 'text', content: '• 不能以数字开头' },
        { type: 'text', content: '• 区分大小写（Name和name是不同的）' },
        { type: 'text', content: '• 不能使用Python的关键字（如print、if、for等）' },
        { type: 'heading', content: '好的变量名示例：' },
        { type: 'code', content: 'user_name = "张三"\nuser_age = 20\nprice = 99.9\nis_student = True' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 变量是存储数据的"盒子"' },
        { type: 'text', content: '• 用等号=给变量赋值' },
        { type: 'text', content: '• 变量名要有意义，见名知意' }
      ]
    }), 3);

    // Lesson 5: 数据类型
    createLesson(pid, '第5课：数据类型 - 数字和字符串', '了解Python中的基本数据类型', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '数据类型概述' },
        { type: 'text', content: 'Python中有多种数据类型，就像现实世界中有整数、小数、文字一样。了解数据类型很重要，因为不同类型的数据有不同的用法。' },
        { type: 'heading', content: '1. 整数（int）' },
        { type: 'text', content: '整数就是没有小数点的数字：' },
        { type: 'code', content: 'age = 20\nscore = 100\ncount = 0' },
        { type: 'heading', content: '2. 浮点数（float）' },
        { type: 'text', content: '浮点数就是带小数点的数字：' },
        { type: 'code', content: 'price = 19.99\npi = 3.14159\nheight = 1.75' },
        { type: 'heading', content: '3. 字符串（str）' },
        { type: 'text', content: '字符串就是文本，用引号包围：' },
        { type: 'code', content: 'name = "小明"\nmessage = \'你好啊！\'\n# 三引号可以换行\ntext = """这是\n多行\n字符串"""' },
        { type: 'heading', content: '4. 布尔值（bool）' },
        { type: 'text', content: '布尔值只有两种：True（真）和False（假）：' },
        { type: 'code', content: 'is_student = True\nis_male = False\nhas_car = True' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• int：整数，如1、100、-5' },
        { type: 'text', content: '• float：小数，如3.14、-0.5' },
        { type: 'text', content: '• str：字符串，如"你好"' },
        { type: 'text', content: '• bool：布尔值，True或False' }
      ]
    }), 4);

    // Lesson 6: 运算符
    createLesson(pid, '第6课：运算符 - 让计算更简单', '学习Python中的算术运算', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '算术运算符' },
        { type: 'text', content: '运算符就是用来做计算的符号。Python中的算术运算符和我们数学课学的一样：' },
        { type: 'code', content: '# 加法\nprint(5 + 3)   # 结果: 8\n\n# 减法\nprint(10 - 4)  # 结果: 6\n\n# 乘法\nprint(6 * 7)   # 结果: 42\n\n# 除法\nprint(15 / 3)  # 结果: 5.0\n\n# 取余（除法后的余数）\nprint(17 % 5)   # 结果: 2\n\n# 整除（只取整数部分）\nprint(17 // 5)  # 结果: 3\n\n# 乘方\nprint(2 ** 10)  # 结果: 1024' },
        { type: 'heading', content: '复合赋值运算符' },
        { type: 'text', content: '还有一种简便写法：' },
        { type: 'code', content: 'x = 10\nx += 5    # 等同于 x = x + 5，结果x=15\nx -= 3    # 等同于 x = x - 3，结果x=12\nx *= 2    # 等同于 x = x * 2，结果x=24' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• + - * / 是基本运算符' },
        { type: 'text', content: '• % 取余数，// 整除，** 乘方' },
        { type: 'text', content: '• += -= *= 是简写形式' }
      ]
    }), 5);

    // Lesson 7: 字符串进阶
    createLesson(pid, '第7课：字符串的魔法', '字符串的常用操作', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '字符串的拼接' },
        { type: 'text', content: '把多个字符串组合在一起：' },
        { type: 'code', content: 'first_name = "张"\nlast_name = "三"\n\n# 方法1：使用 +\nname = first_name + last_name\nprint(name)  # 张三\n\n# 方法2：使用 f-string（推荐）\nname = f"{first_name}{last_name}"\nprint(name)  # 张三\n\n# 方法3：使用 format\nname = "{} {}".format(first_name, last_name)\nprint(name)  # 张 三' },
        { type: 'heading', content: '字符串的常用方法' },
        { type: 'code', content: 'text = "  Hello Python!  "\n\nprint(text.upper())        # HELLO PYTHON!\nprint(text.lower())        # hello python!\nprint(text.strip())        # Hello Python! (去除空格)\nprint(text.replace("Python", "World"))  # Hello World!\nprint(len(text))           # 19 (长度)' },
        { type: 'heading', content: '字符串的索引' },
        { type: 'text', content: '字符串中的每个字符都有一个位置（索引）：' },
        { type: 'code', content: 's = "Python"\nprint(s[0])   # P (第一个字符)\nprint(s[1])   # y (第二个字符)\nprint(s[-1])  # n (最后一个字符)\nprint(s[0:3]) # Pyt (切片：取第1到第3个)' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• f-string是拼接字符串的好方法' },
        { type: 'text', content: '• upper()、lower()、strip()是常用方法' },
        { type: 'text', content: '• 索引从0开始，-1表示最后一个' }
      ]
    }), 6);

    // Lesson 8: 输入和输出
    createLesson(pid, '第8课：与程序互动', '学会获取用户输入', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: 'input() - 获取用户输入' },
        { type: 'text', content: 'input()函数可以让用户输入信息：' },
        { type: 'code', content: '# 基本用法\nname = input("请输入你的名字：")\nprint(f"你好，{name}！")\n\n# 运行效果：\n# 请输入你的名字：小明\n# 你好，小明！' },
        { type: 'heading', content: 'input()的返回值' },
        { type: 'text', content: 'input()返回的永远是字符串类型！如果需要数字，要转换：' },
        { type: 'code', content: '# 获取数字\nage_str = input("请输入你的年龄：")\nage = int(age_str)  # 转为整数\n\n# 或者一行搞定\nage = int(input("请输入你的年龄："))\n\n# 计算明年年龄\nnext_year_age = age + 1\nprint(f"明年你就{next_year_age}岁了！")' },
        { type: 'heading', content: 'input()和类型转换' },
        { type: 'code', content: '# 转成整数\nnum = int("123")\n\n# 转成浮点数\nprice = float("19.99")\n\n# 转成字符串\ntext = str(123)  # "123"\n\n# 转成布尔值（注意！）\nbool(1)     # True\nbool(0)     # False\nbool("")    # False（非空字符串为True）' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• input()让用户输入信息' },
        { type: 'text', content: '• input()返回的是字符串' },
        { type: 'text', content: '• 用int()、float()转换类型' }
      ]
    }), 7);

    // Lesson 9: 条件判断
    createLesson(pid, '第9课：做决定 - 条件判断', '让程序学会"思考"', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: 'if - 如果...就...' },
        { type: 'text', content: '条件判断让程序可以根据不同情况做出不同反应：' },
        { type: 'code', content: 'age = 18\n\nif age >= 18:\n    print("你已经成年了！")\n\n# 运行结果：你已经成年了！' },
        { type: 'heading', content: 'if...else - 如果...否则...' },
        { type: 'code', content: 'age = 16\n\nif age >= 18:\n    print("成年人")\nelse:\n    print("未成年人")\n\n# 运行结果：未成年人' },
        { type: 'heading', content: 'if...elif...else - 多条件判断' },
        { type: 'code', content: 'score = 85\n\nif score >= 90:\n    print("优秀")\nelif score >= 80:\n    print("良好")\nelif score >= 60:\n    print("及格")\nelse:\n    print("需要努力")\n\n# 运行结果：良好' },
        { type: 'heading', content: '比较运算符' },
        { type: 'code', content: '==  等于\n!=  不等于\n>   大于\n<   小于\n>=  大于等于\n<=  小于等于' },
        { type: 'heading', content: '逻辑运算符' },
        { type: 'code', content: 'age = 25\nhas_id = True\n\n# and：两个条件都满足\nif age >= 18 and has_id:\n    print("可以进入")\n\n# or：满足任一条件\nif age < 18 or not has_id:\n    print("不能进入")' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• if 后面跟条件判断' },
        { type: 'text', content: '• else 是"否则"的情况' },
        { type: 'text', content: '• elif 处理多个条件分支' }
      ]
    }), 8);

    // Lesson 10: 循环 - for
    createLesson(pid, '第10课：重复做 - for循环', '让程序自动重复执行', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: 'for循环基础' },
        { type: 'text', content: 'for循环让你可以重复执行代码：' },
        { type: 'code', content: '# 打印5次Hello\nfor i in range(5):\n    print("Hello")\n\n# range(5) 产生 0, 1, 2, 3, 4' },
        { type: 'heading', content: 'range()函数' },
        { type: 'code', content: 'range(5)        # 0, 1, 2, 3, 4\nrange(1, 6)      # 1, 2, 3, 4, 5\nrange(0, 10, 2)  # 0, 2, 4, 6, 8 (步长为2)\nrange(5, 0, -1)  # 5, 4, 3, 2, 1 (倒序)' },
        { type: 'heading', content: '遍历列表' },
        { type: 'code', content: 'fruits = ["苹果", "香蕉", "橙子"]\n\nfor fruit in fruits:\n    print(fruit)\n\n# 运行结果：\n# 苹果\n# 香蕉\n# 橙子' },
        { type: 'heading', content: ' enumerate - 同时获取索引和值' },
        { type: 'code', content: 'fruits = ["苹果", "香蕉", "橙子"]\n\nfor index, fruit in enumerate(fruits):\n    print(f"{index}: {fruit}")\n\n# 运行结果：\n# 0: 苹果\n# 1: 香蕉\n# 2: 橙子' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• for循环重复执行代码' },
        { type: 'text', content: '• range()生成数字序列' },
        { type: 'text', content: '• in 遍历列表中的每个元素' }
      ]
    }), 9);

    // Lesson 11: 循环 - while
    createLesson(pid, '第11课：条件循环 - while循环', '另一种循环方式', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: 'while循环' },
        { type: 'text', content: 'while循环在条件为真时一直执行：' },
        { type: 'code', content: '# 从1数到5\ncount = 1\n\nwhile count <= 5:\n    print(count)\n    count += 1\n\nprint("完成！")' },
        { type: 'heading', content: 'while vs for' },
        { type: 'text', content: '• for：知道要循环多少次\n• while：知道什么时候停止（条件）' },
        { type: 'heading', content: '猜数字游戏' },
        { type: 'code', content: 'import random\n\ntarget = random.randint(1, 100)\nguess = 0\n\nwhile guess != target:\n    guess = int(input("猜一个1-100的数字："))\n    \n    if guess < target:\n        print("太小了！")\n    elif guess > target:\n        print("太大了！")\n    \nprint("恭喜你猜对了！")' },
        { type: 'heading', content: 'break和continue' },
        { type: 'code', content: '# break：跳出循环\nfor i in range(10):\n    if i == 5:\n        break  # 跳出循环\n    print(i)\n# 输出：0 1 2 3 4\n\n# continue：跳过本次循环\nfor i in range(5):\n    if i == 2:\n        continue  # 跳过这次\n    print(i)\n# 输出：0 1 3 4' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• while在条件满足时循环' },
        { type: 'text', content: '• break跳出整个循环' },
        { type: 'text', content: '• continue跳过本次循环' }
      ]
    }), 10);

    // Lesson 12: 列表
    createLesson(pid, '第12课：列表 - 存放多个数据', 'Python中最常用的数据结构', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '创建列表' },
        { type: 'code', content: '# 列表可以存放多个数据\nfruits = ["苹果", "香蕉", "橙子"]\nnumbers = [1, 2, 3, 4, 5]\nmixed = [1, "你好", True, 3.14]\n\n# 空列表\nempty = []' },
        { type: 'heading', content: '访问列表元素' },
        { type: 'code', content: 'fruits = ["苹果", "香蕉", "橙子"]\n\nprint(fruits[0])   # 苹果（第一个）\nprint(fruits[-1])  # 橙子（最后一个）\nprint(fruits[0:2]) # ["苹果", "香蕉"] (切片)' },
        { type: 'heading', content: '修改列表' },
        { type: 'code', content: 'fruits = ["苹果", "香蕉", "橙子"]\n\n# 添加元素\nfruits.append("葡萄")      # 末尾添加\nfruits.insert(1, "梨")     # 指定位置插入\n\n# 删除元素\nfruits.remove("香蕉")      # 删除第一个匹配的\ndel fruits[0]            # 删除指定位置\npopped = fruits.pop()     # 删除末尾并返回\n\nprint(fruits)' },
        { type: 'heading', content: '列表常用方法' },
        { type: 'code', content: 'numbers = [3, 1, 4, 1, 5, 9]\n\nprint(len(numbers))       # 6 (长度)\nprint(max(numbers))       # 9 (最大值)\nprint(min(numbers))       # 1 (最小值)\nprint(numbers.count(1))   # 2 (元素出现次数)\nnumbers.sort()            # 排序\nnumbers.reverse()         # 反转' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 列表用[]创建，可存多个值' },
        { type: 'text', content: '• 索引从0开始' },
        { type: 'text', content: '• append、remove、pop是常用操作' }
      ]
    }), 11);

    // Lesson 13: 列表推导式
    createLesson(pid, '第13课：列表推导式 - 酷炫的写法', '用一行代码创建列表', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是列表推导式？' },
        { type: 'text', content: '列表推导式是Python的一种简洁写法，可以用一行代码生成一个列表。' },
        { type: 'heading', content: '基本语法' },
        { type: 'code', content: '# 传统写法\nsquares = []\nfor i in range(10):\n    squares.append(i ** 2)\n\n# 列表推导式写法（推荐）\nsquares = [i ** 2 for i in range(10)]\nprint(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]' },
        { type: 'heading', content: '带条件的列表推导式' },
        { type: 'code', content: '# 只保留偶数\nevens = [i for i in range(10) if i % 2 == 0]\nprint(evens)  # [0, 2, 4, 6, 8]\n\n# 数字转字符串\nstr_nums = [str(i) for i in range(5)]\nprint(str_nums)  # [\'0\', \'1\', \'2\', \'3\', \'4\']' },
        { type: 'heading', content: '嵌套列表推导式' },
        { type: 'code', content: '# 创建乘法表\ntable = [[i * j for j in range(1, 10)] for i in range(1, 10)]\n\n# 二维矩阵转一维\nmatrix = [[1, 2], [3, 4], [5, 6]]\nflat = [num for row in matrix for num in row]\nprint(flat)  # [1, 2, 3, 4, 5, 6]' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• [表达式 for 变量 in 序列]' },
        { type: 'text', content: '• 可以加 if 条件过滤' },
        { type: 'text', content: '• 简洁又高效！' }
      ]
    }), 12);

    // Lesson 14: 元组和集合
    createLesson(pid, '第14课：元组和集合', '其他容器类型', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '元组（tuple）' },
        { type: 'text', content: '元组和列表类似，但创建后不能修改（不可变）：' },
        { type: 'code', content: '# 创建元组\ncoordinates = (10, 20)\npoint = (1, 2, 3)\n\n# 访问元素\nprint(coordinates[0])  # 10\nprint(coordinates[-1]) # 20\n\n# 不能修改！\n# coordinates[0] = 15  # 会报错！\n\n# 但可以创建新元组\ncoordinates = (15, 25)' },
        { type: 'heading', content: '元组的用途' },
        { type: 'code', content: '# 函数返回多个值\ndef get_user():\n    return "小明", 18, "北京\"\n\nname, age, city = get_user()\nprint(name)  # 小明\nprint(age)   # 18\n\n# 交换变量\nx, y = 1, 2\nx, y = y, x  # 一步交换！' },
        { type: 'heading', content: '集合（set）' },
        { type: 'text', content: '集合是无序、不重复的元素集：' },
        { type: 'code', content: '# 创建集合\nfruits = {"苹果", "香蕉", "橙子"}\n\n# 添加元素\nfruits.add("葡萄")\nfruits.add("苹果")  # 不会重复！\n\n# 删除元素\nfruits.remove("香蕉")\n\nprint(fruits)  # {"苹果", "橙子", "葡萄"}' },
        { type: 'heading', content: '集合运算' },
        { type: 'code', content: 'set1 = {1, 2, 3, 4}\nset2 = {3, 4, 5, 6}\n\nprint(set1 | set2)   # 并集: {1, 2, 3, 4, 5, 6}\nprint(set1 & set2)   # 交集: {3, 4}\nprint(set1 - set2)   # 差集: {1, 2}\nprint(set1 ^ set2)   # 对称差集: {1, 2, 5, 6}' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 元组()不可变，用于固定数据' },
        { type: 'text', content: '• 集合{}无序不重复，用于去重' },
        { type: 'text', content: '• 集合支持数学集合运算' }
      ]
    }), 13);

    // Lesson 15: 字典
    createLesson(pid, '第15课：字典 - 键值对', '强大的键值对数据结构', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '创建字典' },
        { type: 'text', content: '字典存储键值对，就像真实的字典一样：' },
        { type: 'code', content: '# 字典存放键值对\nperson = {\n    "name": "小明",\n    "age": 18,\n    "city": "北京"\n}\n\n# 访问值\nprint(person["name"])  # 小明\nprint(person.get("age"))  # 18\n\n# 访问不存在的键\nprint(person.get("gender", "未知"))  # 未知（默认值）' },
        { type: 'heading', content: '修改字典' },
        { type: 'code', content: 'person = {"name": "小明"}\n\n# 添加/修改\nperson["age"] = 20\nperson["gender"] = "男"\n\n# 删除\ndel person["gender"]\n# 或\ngender = person.pop("gender", "未知")\n\nprint(person)' },
        { type: 'heading', content: '遍历字典' },
        { type: 'code', content: 'person = {"name": "小明", "age": 18, "city": "北京"}\n\n# 遍历所有键\nfor key in person:\n    print(key)\n\n# 遍历键值对\nfor key, value in person.items():\n    print(f"{key}: {value}")' },
        { type: 'heading', content: '字典推导式' },
        { type: 'code', content: '# 交换键值\ndict1 = {"a": 1, "b": 2}\nswapped = {v: k for k, v in dict1.items()}\nprint(swapped)  # {1: \'a\', 2: \'b\'}\n\n# 过滤\nscores = {"数学": 85, "语文": 72, "英语": 90}\npassed = {k: v for k, v in scores.items() if v >= 80}\nprint(passed)  # {\'数学\': 85, \'英语\': 90}' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 字典用{}存储键值对' },
        { type: 'text', content: '• 键必须唯一，值可以是任何类型' },
        { type: 'text', content: '• items()遍历键值对' }
      ]
    }), 14);

    // Lesson 16: 函数基础
    createLesson(pid, '第16课：函数 -  reusable的代码块', '把代码封装成函数', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '为什么用函数？' },
        { type: 'text', content: '函数就像一个机器：输入材料 → 机器处理 → 输出产品。把重复使用的代码封装成函数，可以大大提高效率！' },
        { type: 'heading', content: '定义函数' },
        { type: 'code', content: '# 定义函数\ndef greet():\n    print("你好！")\n\n# 调用函数\ngreet()\ngreet()\ngreet()' },
        { type: 'heading', content: '带参数的函数' },
        { type: 'code', content: '# 带参数的函数\ndef greet(name):\n    print(f"你好，{name}！")\n\ngreet("小明")  # 你好，小明！\ngreet("小红")  # 你好，小红！' },
        { type: 'heading', content: '返回值' },
        { type: 'code', content: '# 返回值\ndef add(a, b):\n    result = a + b\n    return result\n\nsum_result = add(3, 5)\nprint(sum_result)  # 8\n\n# 简写\ndef multiply(x, y):\n    return x * y' },
        { type: 'heading', content: '默认参数' },
        { type: 'code', content: '# 默认参数\ndef greet(name, greeting="你好"):\n    print(f"{greeting}，{name}！")\n\ngreet("小明")           # 你好，小明！\ngreet("小红", "早上好")  # 早上好，小红！' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• 用def定义函数' },
        { type: 'text', content: '• return返回结果' },
        { type: 'text', content: '• 参数可以有默认值' }
      ]
    }), 15);

    // Lesson 17: 函数进阶
    createLesson(pid, '第17课：函数的进阶用法', '更多函数技巧', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '*args 和 **kwargs' },
        { type: 'text', content: '用*args接收任意多个位置参数，**kwargs接收任意多个关键字参数：' },
        { type: 'code', content: '# *args - 任意数量位置参数\ndef sum_all(*args):\n    total = 0\n    for num in args:\n        total += num\n    return total\n\nprint(sum_all(1, 2, 3))      # 6\nprint(sum_all(1, 2, 3, 4))   # 10\n\n# **kwargs - 任意数量关键字参数\ndef print_info(**kwargs):\n    for key, value in kwargs.items():\n        print(f"{key}: {value}")\n\nprint_info(name="小明", age=18)' },
        { type: 'heading', content: '函数作为参数' },
        { type: 'code', content: '# 函数可以作为参数传递\ndef apply(func, x):\n    return func(x)\n\ndef double(x):\n    return x * 2\n\ndef square(x):\n    return x ** 2\n\nprint(apply(double, 5))   # 10\nprint(apply(square, 5))   # 25' },
        { type: 'heading', content: 'lambda匿名函数' },
        { type: 'code', content: '# lambda - 简短函数\nsquare = lambda x: x ** 2\nprint(square(5))  # 25\n\n# 常用场景：排序\nstudents = [("小明", 85), ("小红", 92), ("小刚", 78)]\n\n# 按成绩排序\nstudents.sort(key=lambda x: x[1], reverse=True)\nprint(students)  # [(\'小红\', 92), (\'小明\', 85), (\'小刚\', 78)]' },
        { type: 'heading', content: '变量的作用域' },
        { type: 'code', content: '# 全局变量 vs 局部变量\nglobal_var = "全局"\n\ndef test():\n    local_var = "局部"\n    print(global_var)  # 可以访问\n    print(local_var)  # 可以访问\n\ntest()\n# print(local_var)  # 报错！\n\n# 在函数内修改全局变量\ncounter = 0\ndef increment():\n    global counter\n    counter += 1' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• *args接收任意多参数' },
        { type: 'text', content: '• **kwargs接收关键字参数' },
        { type: 'text', content: '• lambda创建匿名函数' }
      ]
    }), 16);

    // Lesson 18: 模块
    createLesson(pid, '第18课：模块和包', '使用别人的代码', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是模块？' },
        { type: 'text', content: '模块就是一个.py文件。把代码分到不同文件里，就是模块。' },
        { type: 'code', content: '# mymodule.py\ndef say_hello():\n    print("你好！")\n\n# main.py\nimport mymodule\nmymodule.say_hello()' },
        { type: 'heading', content: 'import的多种方式' },
        { type: 'code', content: 'import math\n\nprint(math.pi)        # 3.14159...\nprint(math.sqrt(16))  # 4.0\n\n# 只导入需要的\nfrom math import pi, sqrt\nprint(pi)   # 3.14159...\nprint(sqrt(16))  # 4.0\n\n# as 给模块起别名\nimport math as m\nprint(m.pi)' },
        { type: 'heading', content: '常用标准库' },
        { type: 'code', content: 'import random    # 随机数\nimport datetime   # 日期时间\nimport os         # 操作系统\nimport json        # JSON处理\n\n# random示例\nprint(random.randint(1, 100))  # 1-100随机整数\nprint(random.choice(["a", "b", "c"]))  # 随机选择\n\n# datetime示例\nnow = datetime.datetime.now()\nprint(now.year, now.month, now.day)' },
        { type: 'heading', content: '安装第三方包' },
        { type: 'code', content: '# 用pip安装\n# pip install 包名\n\n# 常用第三方包\n# requests - 网络请求\n# numpy - 数值计算\n# pandas - 数据分析\n# matplotlib - 数据可视化\n# flask/django - Web开发' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• import导入模块' },
        { type: 'text', content: '• from...import导入特定功能' },
        { type: 'text', content: '• pip install安装第三方包' }
      ]
    }), 17);

    // Lesson 19: 文件操作
    createLesson(pid, '第19课：文件操作', '读写文件', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '读取文件' },
        { type: 'code', content: '# 读取整个文件\nwith open("test.txt", "r", encoding="utf-8") as f:\n    content = f.read()\n    print(content)\n\n# 逐行读取\nwith open("test.txt", "r", encoding="utf-8") as f:\n    for line in f:\n        print(line.strip())  # strip()去除换行符' },
        { type: 'heading', content: '写入文件' },
        { type: 'code', content: '# 写入文件（会覆盖）\nwith open("test.txt", "w", encoding="utf-8") as f:\n    f.write("第一行\\n")\n    f.write("第二行\\n")\n\n# 追加内容\nwith open("test.txt", "a", encoding="utf-8") as f:\n    f.write("追加的内容\\n")' },
        { type: 'heading', content: '文件操作模式' },
        { type: 'code', content: 'r   只读（默认）\nw   只写（覆盖）\na   追加\nrb   二进制读取\nwb   二进制写入\nr+  读写' },
        { type: 'heading', content: 'JSON文件' },
        { type: 'code', content: 'import json\n\n# 写入JSON\ndata = {"name": "小明", "age": 18}\nwith open("data.json", "w", encoding="utf-8") as f:\n    json.dump(data, f, ensure_ascii=False)\n\n# 读取JSON\nwith open("data.json", "r", encoding="utf-8") as f:\n    data = json.load(f)\n    print(data)' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• with open()自动管理文件' },
        { type: 'text', content: '• r读取，w写入，a追加' },
        { type: 'text', content: '• json模块处理JSON文件' }
      ]
    }), 18);

    // Lesson 20: 异常处理
    createLesson(pid, '第20课：异常处理', '让程序更健壮', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是异常？' },
        { type: 'text', content: '程序运行时可能会出现错误，比如除以0、打开不存在的文件等，这就是异常。' },
        { type: 'heading', content: 'try...except' },
        { type: 'code', content: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print("不能除以0！")' },
        { type: 'heading', content: '捕获具体异常' },
        { type: 'code', content: 'try:\n    num = int(input("请输入数字："))\n    result = 10 / num\nexcept ValueError:\n    print("输入的不是数字！")\nexcept ZeroDivisionError:\n    print("不能除以0！")\nexcept Exception as e:\n    print(f"发生错误：{e}")' },
        { type: 'heading', content: 'finally和else' },
        { type: 'code', content: 'try:\n    file = open("test.txt", "r")\n    content = file.read()\nexcept FileNotFoundError:\n    print("文件不存在")\nelse:\n    print("读取成功！")  # 只有没异常时执行\nfinally:\n    print("结束")  # 无论如何都执行\n    # if file:\n    #     file.close()' },
        { type: 'heading', content: '抛出异常' },
        { type: 'code', content: '# 主动抛出异常\ndef divide(a, b):\n    if b == 0:\n        raise ValueError("除数不能为0")\n    return a / b\n\ntry:\n    result = divide(10, 0)\nexcept ValueError as e:\n    print(e)  # 除数不能为0' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• try...except捕获异常' },
        { type: 'text', content: '• finally无论是否有异常都执行' },
        { type: 'text', content: '• raise主动抛出异常' }
      ]
    }), 19);

    // Lesson 21: 面向对象基础
    createLesson(pid, '第21课：面向对象 - 类和对象', 'Python的OOP入门', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '类和对象' },
        { type: 'text', content: '类是对一类事物的抽象描述（比如"人"），对象是具体的实例（比如"小明"）。' },
        { type: 'code', content: '# 定义类\nclass Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n    \n    def say_hello(self):\n        print(f"你好，我叫{self.name}，今年{self.age}岁")\n\n# 创建对象\nperson1 = Person("小明", 18)\nperson2 = Person("小红", 20)\n\nperson1.say_hello()\nperson2.say_hello()' },
        { type: 'heading', content: '__init__方法' },
        { type: 'text', content: '__init__是构造函数，创建对象时自动调用：' },
        { type: 'code', content: 'class Student:\n    def __init__(self, name, grade):\n        self.name = name\n        self.grade = grade\n        print(f"{name}入学了！")\n\n# 创建对象时自动调用\ns = Student("小刚", 3)  # 输出：小刚入学了！' },
        { type: 'heading', content: '类和实例属性' },
        { type: 'code', content: 'class Dog:\n    # 类属性（所有实例共享）\n    species = "狗"\n    \n    def __init__(self, name):\n        # 实例属性（每个对象独立）\n        self.name = name\n        self.tricks = []\n    \n    def learn(self, trick):\n        self.tricks.append(trick)\n\ndog1 = Dog("旺财")\ndog2 = Dog("小白")\n\ndog1.learn("坐下")\nprint(dog1.tricks)  # [\'坐下\']\nprint(dog2.tricks)  # []' },
        { type: 'heading', content: '方法类型' },
        { type: 'code', content: 'class Calculator:\n    def add(self, a, b):          # 实例方法\n        return a + b\n    \n    @staticmethod\n    def multiply(a, b):            # 静态方法\n        return a * b\n    \n    @classmethod\n    def info(cls):                 # 类方法\n        return "这是一个计算器类"\n\n# 调用方式\ncalc = Calculator()\nprint(calc.add(2, 3))        # 5\nprint(Calculator.multiply(2, 3))  # 6\nprint(Calculator.info())' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• class定义类' },
        { type: 'text', content: '• __init__构造函数' },
        { type: 'text', content: '• self指代实例本身' }
      ]
    }), 20);

    // Lesson 22: 继承
    createLesson(pid, '第22课：继承 - 代码复用', '面向对象的继承机制', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '什么是继承？' },
        { type: 'text', content: '继承允许我们基于已有类创建新类，复用父类的代码。' },
        { type: 'code', content: '# 父类\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n    \n    def eat(self):\n        print(f"{self.name}在吃东西")\n    \n    def sleep(self):\n        print(f"{self.name}在睡觉")\n\n# 子类继承父类\nclass Dog(Animal):\n    def bark(self):\n        print(f"{self.name}在汪汪叫")\n\ndog = Dog("旺财")\ndog.eat()    # 继承自父类\ndog.sleep()  # 继承自父类\ndog.bark()   # 子类自己的方法' },
        { type: 'heading', content: '重写方法' },
        { type: 'code', content: 'class Cat(Animal):\n    def sleep(self):  # 重写父类方法\n        print(f"{self.name}蜷成一团在睡觉")\n\ncat = Cat("咪咪")\ncat.sleep()  # 调用子类版本' },
        { type: 'heading', content: 'super()调用父类' },
        { type: 'code', content: 'class Student(Person):\n    def __init__(self, name, age, school):\n        super().__init__(name, age)  # 调用父类__init__\n        self.school = school\n    \n    def introduce(self):\n        super().say_hello()  # 调用父类方法\n        print(f"我在{self.school}上学")' },
        { type: 'heading', content: '多继承' },
        { type: 'code', content: 'class Flyer:\n    def fly(self):\n        print("我能飞")\n\nclass Swimmer:\n    def swim(self):\n        print("我能游泳")\n\nclass Duck(Animal, Flyer, Swimmer):\n    pass\n\nduck = Duck("唐老鸭")\nduck.eat()\nduck.fly()\nswim()' },
        { type: 'divider' },
        { type: 'heading', content: '💡 今日小结' },
        { type: 'text', content: '• class子类(父类)实现继承' },
        { type: 'text', content: '• super()调用父类方法' },
        { type: 'text', content: '• 可以多重继承' }
      ]
    }), 21);

    // Lesson 23: 综合练习
    createLesson(pid, '第23课：综合练习 - 记事本程序', '做一个完整的程序', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '项目：命令行记事本' },
        { type: 'text', content: '学到这里，你已经掌握了Python的基础知识！让我们做一个综合练习：命令行记事本程序。' },
        { type: 'heading', content: '功能需求：' },
        { type: 'text', content: '1. 添加笔记\n2. 查看所有笔记\n3. 删除笔记\n4. 保存到文件\n5. 从文件加载' },
        { type: 'heading', content: '完整代码：' },
        { type: 'code', content: 'import json\nimport os\n\nclass Notebook:\n    def __init__(self, filename="notes.json"):\n        self.filename = filename\n        self.notes = []\n        self.load()\n    \n    def add_note(self):\n        content = input("请输入笔记内容：")\n        note = {"id": len(self.notes) + 1, "content": content}\n        self.notes.append(note)\n        print("笔记添加成功！")\n    \n    def show_notes(self):\n        if not self.notes:\n            print("还没有笔记！")\n            return\n        for note in self.notes:\n            print(f"{note[\'id\"]}. {note[\'content\"]}")\n    \n    def delete_note(self):\n        self.show_notes()\n        try:\n            note_id = int(input("请输入要删除的笔记编号："))\n            self.notes = [n for n in self.notes if n["id"] != note_id]\n            print("删除成功！")\n        except ValueError:\n            print("输入无效！")\n    \n    def save(self):\n        with open(self.filename, "w", encoding="utf-8") as f:\n            json.dump(self.notes, f, ensure_ascii=False)\n        print("保存成功！")\n    \n    def load(self):\n        if os.path.exists(self.filename):\n            with open(self.filename, "r", encoding="utf-8") as f:\n                self.notes = json.load(f)\n\ndef main():\n    notebook = Notebook()\n    \n    while True:\n        print("\\n=== 记事本 ===")\n        print("1. 添加笔记")\n        print("2. 查看笔记")\n        print("3. 删除笔记")\n        print("4. 保存笔记")\n        print("5. 退出")\n        \n        choice = input("请选择：")\n        \n        if choice == "1":\n            notebook.add_note()\n        elif choice == "2":\n            notebook.show_notes()\n        elif choice == "3":\n            notebook.delete_note()\n        elif choice == "4":\n            notebook.save()\n        elif choice == "5":\n            print("再见！")\n            break\n        else:\n            print("无效选择！")\n\nif __name__ == "__main__":\n    main()' },
        { type: 'heading', content: '运行效果：' },
        { type: 'text', content: '=== 记事本 ===\n1. 添加笔记\n2. 查看笔记\n3. 删除笔记\n4. 保存笔记\n5. 退出\n请选择：1\n请输入笔记内容：今天天气真好\n笔记添加成功！' },
        { type: 'divider' },
        { type: 'heading', content: '🎉 恭喜你完成了一个完整的程序！' },
        { type: 'text', content: '这个程序用到了我们学的：\n• 类和对象\n• 列表和字典\n• 文件操作\n• 异常处理\n• 循环和条件判断\n• 函数' }
      ]
    }), 22);

    // Lesson 24: 接下来学什么
    createLesson(pid, '第24课：继续前行', 'Python学习之路', 'text', JSON.stringify({
      blocks: [
        { type: 'heading', content: '🎉 恭喜你完成了Python基础学习！' },
        { type: 'text', content: '从什么都不懂到能写出完整程序，你已经迈出了编程的第一步！' },
        { type: 'heading', content: '接下来学什么？' },
        { type: 'heading', content: '1. Web开发' },
        { type: 'text', content: '• Flask - 轻量级Web框架\n• Django - 全功能Web框架\n• 学习HTML、CSS、JavaScript' },
        { type: 'heading', content: '2. 数据分析' },
        { type: 'text', content: '• NumPy - 数值计算\n• Pandas - 数据处理\n• Matplotlib - 数据可视化' },
        { type: 'heading', content: '3. 人工智能/机器学习' },
        { type: 'text', content: '• TensorFlow / PyTorch - 深度学习\n• scikit-learn - 机器学习' },
        { type: 'heading', content: '4. 自动化/脚本' },
        { type: 'text', content: '• 自动化办公\n• 爬虫\n• 自动化测试' },
        { type: 'heading', content: '学习建议：' },
        { type: 'text', content: '1. 多动手写代码\n2. 遇到问题先自己搜索\n3. 看别人的源码学习\n4. 参与开源项目\n5. 坚持每天写一点' },
        { type: 'divider' },
        { type: 'heading', content: '🚀 祝你在编程之路上一路顺风！' },
        { type: 'text', content: '记住：编程最重要的是动手实践。\n不要只看，要写！\n\n加油！你是最棒的！💪' }
      ]
    }), 23);

    console.log('✅ Python course created with 24 lessons');
  } else {
    console.log('✅ Python course already exists');
  }
  
  saveDb();
  console.log('🎉 Seed completed!');
  process.exit(0);
}

seed().catch(console.error);
