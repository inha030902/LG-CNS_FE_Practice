# Tailwind 동적 클래스 해결책과 버전별 대응

- 날짜: 2026-10-30
- 대상: `lgcns-fe-next`에 설치된 Tailwind CSS 4.3.3
- 이 문서는 예제만 담고, 프로젝트 소스 파일은 수정하지 않았다.
- 앞 문서: `docs/2026-10-30-tailwind-dynamic-class-names.md`

앞 문서의 결론은 그대로다. `` `bg-${color}-600` ``처럼 클래스 이름 중간을 변수로 채우면 CSS가 생성되지 않는다. 이 문서는 그때 쓸 수 있는 작성법, Tailwind CSS 5를 찾았을 때의 사실, 동적으로 보여도 생성되는 예제를 정리한다.

## 1. 지금 버전에서 쓰는 해결책

공식 문서 [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)의 순서는 세 가지다. 선택지가 소스에 있으면 완성된 클래스 문자열을 적고, 파일 밖에 있는 클래스만 `@source inline()`으로 미리 만든다. 숫자처럼 집합이 열려 있으면 클래스 이름을 만들지 말고 CSS 변수나 `style`로 값만 바꾼다.

### 1.1 완성된 이름을 소스에 적고, 실행 때는 고르기만 한다

공식 문서의 권장 예다. 백틱을 써도 된다. `${}` 안에 들어가는 값이 클래스 조각이 아니라, 이미 파일에 적힌 완성된 문자열이면 된다.

```tsx
function BannerTitle({ tone }: { tone: "white" | "red" }) {
  const toneClass = {
    white: "text-white",
    red: "text-red-500",
  }[tone]

  return <h3 className={`${toneClass} text-2xl font-bold text-center`}>{/* ... */}</h3>
}
```

`text-white`, `text-red-500`, `text-2xl`, `font-bold`, `text-center`가 소스에 통째로 있다. Tailwind 4.3.3 스캐너가 그 토큰으로 CSS를 만든다.

이 저장소는 이미 이 방식에 가깝다.

- `component/atoms/CustomTitle.tsx`는 `"text-2xl font-bold text-center text-white"`를 통째로 넘긴다.
- `component/molecules/BannerSwiperItem.tsx`는 `className="text-red-500"`를 통째로 넘긴다.
- `twMerge`는 둘 중 색만 `text-red-500`로 남긴다. 이름을 조립하지 않는다.

조건이 둘뿐이면 맵 없이 삼항 연산자도 된다. 두 문자열 모두 완성되어 있어야 한다.

```tsx
className={isOpen ? "block" : "hidden"}
```

### 1.2 파일 밖에 문자열이 있으면 `@source inline()`으로 그 이름을 미리 만든다

CMS, DB, 번역 문자열처럼 빌드 중인 소스 파일에 클래스 이름이 없으면 스캐너가 볼 수 없다. Tailwind 3의 `safelist`를 4.1부터는 CSS의 `@source inline()`이 대신한다. [v4.1 발표](https://tailwindcss.com/blog/tailwindcss-v4-1)와 현재 문서의 Safelisting specific utilities 절이 그 설명이다.

`app/globals.css`는 지금 `@import "tailwindcss";`만 있다. 아래는 그 파일에 넣었을 때의 형태를 보여주는 예제이고, 이 저장소에는 추가하지 않았다.

```css
@import "tailwindcss";

@source inline("underline");
@source inline("{hover:,focus:,}underline");
@source inline("{hover:,}bg-red-{50,{100..900..100},950}");
```

중괄호는 빌드 때 펼쳐진다. 마지막 줄은 `bg-red-50`, `bg-red-100`부터 `bg-red-900`, `bg-red-950`과 각각의 `hover:` 변형을 CSS에 넣는다. 그 다음에야 런타임의 `` `bg-red-${shade}` ``가 화면에서 먹을 수 있다. 스캐너가 변수를 계산해서가 아니다. 만들어 둔 CSS 클래스 이름과 운 좋게 같은 문자열이 되었기 때문이다. `shade`가 `200`이면 `bg-red-200`은 있고, `123`이면 없다.

특정 유틸리티를 빼려면 `@source not inline("container")`를 쓴다. Tailwind 4의 JS 설정에는 `safelist` 키가 없다. [Functions and directives](https://tailwindcss.com/docs/functions-and-directives)는 `corePlugins`, `safelist`, `separator`가 v4.0 JS 설정에서 지원되지 않고, safelist는 `@source inline()`을 쓰라고 적는다.

### 1.3 값이 열려 있으면 클래스 이름 대신 값만 바꾼다

열 개수가 1부터 12의 정해진 단계가 아니라 서버가 주는 임의 정수라면, 가능한 `grid-cols-*`를 전부 safelist하는 편이 문서가 말하는 마지막 수단이다. 클래스 이름은 고정하고 값만 런타임에 넣는다.

```tsx
export function BannerGrid({ columns }: { columns: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    />
  )
}
```

색을 데이터로 받을 때도 같다. 클래스 `bg-[var(--banner)]`는 소스에 완성된 이름으로 두고, 색 값만 변수로 바꾼다.

```tsx
export function Swatch({ hex }: { hex: string }) {
  return (
    <div
      className="size-10 rounded-full bg-[var(--swatch)]"
      style={{ ["--swatch" as string]: hex }}
    />
  )
}
```

`globals.css`의 `--background`, `--foreground`도 이 계열이다. 라이트와 다크에서 변수 값만 바뀌고, 유틸리티 이름을 `bg-${mode}`로 만들지 않는다.

## 2. Tailwind CSS 5의 대응

2026-10-30에 확인한 공식 상태는 다음과 같다.

- [Tailwind 블로그](https://tailwindcss.com/blog)의 최신 발표는 2026-05-08의 [v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3)이다.
- [CHANGELOG](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md)의 최신 릴리스 제목은 `[4.3.3] - 2026-07-16`이다. `5.0.0` 항목은 없다.
- 이 프로젝트 `node_modules/tailwindcss/package.json`의 버전도 `4.3.3`이다.

따라서 Tailwind CSS 5용으로 공개된 동적 클래스 대응법은 없다. `` `bg-${color}-600` ``을 빌드 타임에 풀어서 CSS를 만드는 기능이 5에 들어왔다는 공식 문서는 확인되지 않았다.

2026-10-03 [GitHub Discussion #20530](https://github.com/tailwindlabs/tailwindcss/discussions/20530)은 `` `max-${breakpoint}:overflow-hidden` ``처럼 정적으로 보이는 보간도 감지해 달라는 요청이다. 토론은 현재 추출기가 소스를 실행하지 않으므로 그 문자열이 토큰으로 보이지 않는다고 정리한다. 이후 릴리스 노트에 이 요청이 구현되었다는 항목은 없다.

이름이 비슷한 다른 제품과 섞이면 안 된다.

| 이름 | 정체 | 동적 클래스와의 관계 |
| --- | --- | --- |
| Tailwind CSS 4.3.3 | 이 프로젝트가 쓰는 프레임워크 | 텍스트 스캔. 조각 조합은 미지원. `@source inline()`이 safelist |
| Tailwind CSS 5 | 2026-10-30 기준 공식 릴리스 없음 | 대응법을 적을 문서가 없음 |
| NativeWind v5 | React Native용 스타일 라이브러리 | [안내](https://www.nativewind.dev/blog/v5-migration-guide)는 Tailwind CSS v4의 클래스 이름 변경을 따른다고 적는다. Tailwind CSS 5가 아니다 |
| v4의 Dynamic utility values | [v4.0 발표](https://tailwindcss.com/blog/tailwindcss-v4)의 표현 | 설정 파일에 간격을 미리 등록하지 않아도 `mt-17`, `w-[23px]`, `data-[size=lg]:flex` 같은 완성된 클래스를 쓸 수 있다는 뜻이다. `` `mt-${n}` ``을 계산한다는 뜻이 아니다 |

v4로 올리면서 바뀐 대응은 v3 `tailwind.config.js`의 `safelist` 배열을 CSS `@source inline()`으로 옮긴 것이다. v5로 올리면서 바뀐 대응은 아직 없다. 지금 저장소에 필요한 작성법은 4.3.3 문서의 완성된 클래스, `@source inline()`, CSS 변수다.

## 3. 동적 구성이 되는 예제와 안 되는 예제

아래 예제는 이 저장소의 배너 제목, 열림 상태, 그리드를 소재로 한 설명용 코드다. 파일에 반영하지 않았다.

### 3.1 된다. 백틱 안에서 완성된 클래스만 고른다

```tsx
export function MenuPanel({ open }: { open: boolean }) {
  return (
    <div className={`${open ? "block" : "hidden"} md:flex`}>
      <a href="/">Home</a>
    </div>
  )
}
```

`block`, `hidden`, `md:flex`가 각각 완성된 토큰이다. `app/layout.tsx`의 `` `${blackHanSans.variable} h-full antialiased` ``도 같은 종류다. `h-full`과 `antialiased`는 Tailwind 유틸리티로 생성되고, `${blackHanSans.variable}`는 `next/font`가 넣는 폰트 클래스다.

### 3.2 된다. 맵에 완성된 문자열을 두고 `cn`으로 합친다

```tsx
import { cn } from "@/lib/utils"

const titleTone = {
  white: "text-white",
  red: "text-red-500",
} as const

export function BannerHeading({
  tone,
}: {
  tone: keyof typeof titleTone
}) {
  return (
    <h3 className={cn("text-2xl font-bold text-center", titleTone[tone])}>
      Cat Banner Title
    </h3>
  )
}
```

`cn`은 `clsx`로 합치고 `twMerge`로 `text-white`와 `text-red-500` 중 나중 색을 남긴다. CSS 생성은 그 앞에 있는 완성된 문자열 덕분이다. `lib/utils.ts`의 `cn`이 변수를 클래스 조각으로 해석하지는 않는다.

### 3.3 된다. 정해진 색 단계만 `@source inline()`으로 펼친 뒤 변수를 붙인다

CSS 예제:

```css
@import "tailwindcss";
@source inline("text-red-{400,500,600}");
```

TSX 예제:

```tsx
const allowed = [400, 500, 600] as const

export function ToneText({
  shade,
}: {
  shade: (typeof allowed)[number]
}) {
  return <p className={`text-red-${shade}`}>Cat Banner Description</p>
}
```

`shade`가 400, 500, 600일 때만 대응하는 CSS가 있다. `` `text-red-${shade}` `` 문장 자체는 여전히 스캐너가 풀지 못한다. `@source inline`이 `text-red-400`, `text-red-500`, `text-red-600`을 미리 만들어 두었기 때문에 그중 하나와 일치할 때만 보인다.

### 3.4 된다. 임의 값은 클래스에 숫자를 적지 않고 CSS 변수로 보낸다

```tsx
export function OffsetCard({ y }: { y: number }) {
  return (
    <article
      className="translate-y-[var(--banner-y)]"
      style={{ ["--banner-y" as string]: `${y}px` }}
    />
  )
}
```

클래스 이름은 항상 `translate-y-[var(--banner-y)]`이다. 스캐너가 이 완성된 이름을 본다. `y`가 12든 48이든 클래스 문자열은 바뀌지 않는다.

### 3.5 안 된다. 글자와 변수를 붙여 유틸리티 이름을 만든다

```tsx
export function BrokenTitle({ color }: { color: string }) {
  return <h3 className={`text-${color}-500 text-2xl`}>Cat Banner Title</h3>
}
```

`color`가 `"red"`여도 소스의 토큰은 `text-`, `text-2xl`이지 `text-red-500`가 아니다. `text-2xl`만 생성된다. `CustomTitle`에 이 형태로 `className`을 넘겨도 `twMerge`가 구하지 못한다. 합칠 CSS 규칙이 빌드 결과에 없다.

같은 이유로 아래도 생성되지 않는다.

```tsx
className={`md:${visible}`}
className={"bg-" + color + "-500"}
className={`grid-cols-${columns}`}
```

`columns`가 항상 3이라도 `` `grid-cols-${columns}` ``는 `grid-cols-3`이라는 글자를 소스에 남기지 않는다. `grid-cols-3`을 맵이나 `@source inline("grid-cols-3")`에 따로 적어야 한다.

## 4. 이 저장소에 대입한 선택

| 상황 | 이 저장소에서 가까운 코드 | 쓸 해결책 |
| --- | --- | --- |
| 배너 제목 색이 흰색 또는 빨강 | `CustomTitle` + `BannerSwiperItem`의 `text-red-500` | 완성된 클래스 문자열. 이미 이 형태 |
| 모바일 메뉴를 숨기거나 보이기 | `MobileNavigation`의 `md:hidden`, 상태 `isOpen` | `hidden`과 `block`처럼 완성된 클래스를 조건으로 고름 |
| 폰트 CSS 변수를 `className`에 넣기 | `app/layout.tsx`의 `${blackHanSans.variable}` | 변수는 폰트 클래스. Tailwind 유틸리티는 `h-full antialiased`처럼 완성된 채 둠 |
| DB에서 `bg-red-200` 같은 문자열이 옴 | 해당 코드 없음 | 가능한 이름만 `@source inline()` |
| 배너 간격이 임의 픽셀 | 해당 코드 없음 | `mt-[var(--space)]`와 `style` |

## 5. 공식 문서

- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files). Dynamic class names, Safelisting specific utilities.
- [Functions and directives의 `@source`](https://tailwindcss.com/docs/functions-and-directives). v4에서 JS `safelist`가 `@source inline()`으로 바뀐 설명.
- [Tailwind CSS v4.1](https://tailwindcss.com/blog/tailwindcss-v4-1). `@source inline()` 도입.
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4). Dynamic utility values의 의미.
- [Tailwind CSS v4.3](https://tailwindcss.com/blog/tailwindcss-v4-3). 블로그 기준 4.x 최신 발표.
- [tailwindcss CHANGELOG](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md). 2026-07-16의 4.3.3이 최신 릴리스 항목.
- [Discussion #20530](https://github.com/tailwindlabs/tailwindcss/discussions/20530). 보간 클래스 감지 요청. 2026-10-30 기준 구현 발표 없음.
- [tailwind-merge](https://github.com/dcastil/tailwind-merge). `cn`의 런타임 병합.
