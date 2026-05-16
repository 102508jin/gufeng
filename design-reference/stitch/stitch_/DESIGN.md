---
name: 温润古风设计系统
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#51443d'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#83746b'
  outline-variant: '#d5c3b9'
  surface-tint: '#805435'
  primary: '#623b1e'
  on-primary: '#ffffff'
  primary-container: '#7d5233'
  on-primary-container: '#ffcaa7'
  inverse-primary: '#f4bb94'
  secondary: '#695d42'
  on-secondary: '#ffffff'
  secondary-container: '#f1e1be'
  on-secondary-container: '#6f6348'
  tertiary: '#47443c'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f5c53'
  on-tertiary-container: '#dad4c9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#f4bb94'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#653d20'
  secondary-fixed: '#f1e1be'
  secondary-fixed-dim: '#d5c5a4'
  on-secondary-fixed: '#231b06'
  on-secondary-fixed-variant: '#50462c'
  tertiary-fixed: '#e8e2d6'
  tertiary-fixed-dim: '#cbc6ba'
  on-tertiary-fixed: '#1e1c14'
  on-tertiary-fixed-variant: '#4a473e'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
typography:
  display-lg:
    fontFamily: Noto Serif
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 44px
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Noto Serif
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Noto Serif
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 28px
  label-sm:
    fontFamily: Source Sans Three
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: auto
---

## 品牌与风格

本设计系统旨在为古风问答平台营造一种“温润如玉、静谧治学”的感官体验。设计风格融合了**极简主义**与**现代中式美学**，强调留白带来的呼吸感与排版的严谨性。

目标受众是热爱传统文化、寻求深度交流的学者与爱好者。UI 应当唤起用户内心的宁静，通过柔和的曲线和克制的色彩，消除互联网产品常见的躁动感，建立一个专业且具有人文关怀的学术空间。

视觉准则：
- **克制**：不使用夸张的装饰，以内容为核心。
- **温润**：避开锐利的棱角，采用大圆角设计，模拟打磨过的玉石质感。
- **秩序**：借鉴古籍装帧的逻辑，保持严谨的栅格与对齐。

## 色彩

色彩方案灵感来源于传统的宣纸、古墨与木制家具，整体倾向于暖色调，以增强“温和”的视觉感受。

- **主色 (栗色)**：用于关键行动点与品牌标识，代表沉稳与权威，但在明度上做了微调，使其不显沉闷。
- **辅助色 (青灰/檀香)**：用于次要交互与分类标签，起到平衡画面的作用。
- **背景色 (纸墨色)**：背景不使用纯白，而是采用带有淡淡纤维感的浅米色 (#F9F7F2)，模拟宣纸的视觉舒适度，减轻长时间阅读的视觉疲劳。
- **中性色 (墨黑)**：文字主要使用高明度的墨色，而非纯黑，保持对比度的同时也更具书卷气。

## 字体排版

排版逻辑遵循“竖排意蕴，横排逻辑”。

- **标题层级**：统一使用 **Noto Serif**，利用其衬线特征模拟毛笔书写的起始与转折，展现古典神韵。大型标题适当收紧字间距，增强视觉冲击力。
- **正文层级**：同样使用 **Noto Serif** 以保持风格高度统一，但在行高（Line Height）上设定得较为宽松（1.6x - 1.8x），确保长文阅读的舒适性。
- **功能性文本**：在按钮、输入框提示语等微观层级，可辅以 **Source Sans Three** 这种现代无衬线体，以确保在小尺寸下的极致清晰度和现代易用性。

## 布局与间距

本设计系统采用**固定比例栅格系统**，强调页面的平衡感与对称性。

- **栅格模型**：桌面端采用 12 列栅格，容器最大宽度限制在 1200px 左右，以模拟书籍页面的比例。移动端采用单列或双列布局，左右留白保持在 16px 以上。
- **间距节奏**：基于 8px 的基础倍数。为了体现“温和”与“呼吸感”，模块之间的垂直间距（Margin-bottom）倾向于使用较大的 `lg` (48px) 或 `xl` (80px) 档位。
- **留白哲学**：内容区不应填满屏幕，应通过四周宽大的安全边距将用户视线引导至中心区域，营造类似画轴展开的视觉流。

## 深度与层次

为了维持平稳、学术的视觉调性，本设计系统放弃了深重的投影，转而采用**色块堆叠 (Tonal Layers)** 与**极轻微的自然阴影**。

- **分层逻辑**：通过背景色的明度微调来区分层级。底层为纸色，悬浮层（如对话框）采用纯白色并辅以模糊半径极大的扩散阴影（Color: Primary 5%, Blur: 20px），模拟物体漂浮在纸面上的轻盈感。
- **描边应用**：在浅色背景下，使用比背景深 5% 的低对比度细描边来界定容器边界，而非使用投影，这能让界面看起来更扁平、更具印刷感。

## 形状

形状是本次风格调整的核心。为了中和学术内容的严肃感，引入了**中大圆角 (Rounded)** 体系。

- **基础圆角**：所有标准组件（如搜索框、卡片）统一使用 `0.5rem (8px)` 的圆角，这能显著提升界面的亲和力。
- **容器圆角**：大型容器或浮窗使用 `1rem (16px)`。
- **极值应用**：标签（Tags）与头像采用全圆角（Pill-shaped），模拟园林中漏窗或鹅卵石的形态，增加视觉的灵动感。

## 组件规范

- **按钮 (Buttons)**：采用全圆角或 `0.5rem` 圆角。主按钮使用主色填充，文字反白；次要按钮使用主色描边，背景透明，点击时产生微弱的色块填充。
- **输入框 (Input Fields)**：背景色应比页面主背景略深，采用 `0.5rem` 圆角。聚焦状态下，描边颜色转为主色，并带有淡淡的呼吸感外发光。
- **卡片 (Cards)**：卡片应取消明显的投影，改用极细的浅色描边或微弱的背景色差。内部间距需保持在 `24px` 以上，确保信息条理清晰。
- **问答列表 (Q&A List)**：每条问答之间使用极细的虚线或浅色实线分隔，线段两端不触碰容器边缘，保持视觉上的呼吸感。
- **装饰元素**：可适度在页面转角处使用低饱和度的云纹或印章纹样作为点缀，但透明度不应高于 10%，以免干扰阅读。