# Tailwind에서 백틱과 변수를 조합하면 클래스가 안 잡히는 이유

- 날짜: 2026-10-30
- 대상: Tailwind CSS 4.3.3, `lgcns-fe-next`
- 질문: 테일윈드를 쓸 때 백틱 안에 글자와 변수를 조합하면 인식이 안 됐던 것으로 기억한다. 맞는지 코드를 기준으로 확인해 달라.
- 이 문서는 설명을 위한 정리이고, 프로젝트 코드는 바꾸지 않았다.

기억은 맞다. 다만 원인은 백틱 문법이 아니다. Tailwind가 소스 파일을 프로그램으로 실행하지 않고 글자 그대로 훑기 때문이다. 클래스 이름 중간에 `${변수}`를 끼워 넣으면, 완성된 클래스 문자열이 파일에 없어서 CSS가 만들어지지 않는다.

## 1. 공식 설명이 말하는 것

Tailwind 4 문서의 [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)는 소스 파일을 일반 텍스트로 스캔한다고 적는다. 문자열 연결이나 보간을 프로그래밍 언어로 이해하지 못한다.

문서가 하지 말라고 든 JSX 예는 이 질문과 같은 형태다.

```jsx
function Button({ color, children }) {
  return (
    <button className={`bg-${color}-600 hover:bg-${color}-500 ...`}>
      {children}
    </button>
  )
}
```

`color`가 `"red"`여도 파일 안에는 `bg-red-600`이라는 완성된 문자열이 없다. 스캐너가 보는 조각은 `bg-`, `${color}`, `-600`이다. `bg-red-600`용 CSS는 생성되지 않고, 브라우저에 클래스 속성만 붙는다.

문서가 허용하는 형태는 완성된 클래스 이름을 소스에 그대로 적는 것이다.

```jsx
function Button({ color, children }) {
  const colorVariants = {
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
  }
  return (
    <button className={`${colorVariants[color]} ...`}>{children}</button>
  )
}
```

여기도 백틱을 쓴다. 차이는 `${colorVariants[color]}`가 클래스 조각을 조립하지 않는다는 점이다. `"bg-blue-600 hover:bg-blue-500"`와 `"bg-red-600 hover:bg-red-500"`가 파일에 완성된 문자열로 있다. 스캐너는 그 문자열을 보고 CSS를 만든다. 실행 시점에는 그중 하나를 고르기만 한다.

## 2. 이 프로젝트에서 확인한 것

설치 버전은 `lgcns-fe-next/package.json` 기준 Tailwind CSS 4.3.3이다. `app/globals.css`는 `@import "tailwindcss"`만 있고, 클래스 목록을 JS 설정 파일에 적지 않는다. Tailwind 4의 자동 소스 감지가 프로젝트 파일을 텍스트로 읽는다.

### 2.1 백틱을 써도 인식되는 코드

`app/layout.tsx`는 백틱과 `${}`를 함께 쓴다.

```tsx
<html
  className={`${blackHanSans.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>
```

`h-full`과 `antialiased`는 백틱 안에 있지만 이름이 쪼개지지 않았다. 소스에 완성된 유틸리티로 적혀 있으므로 Tailwind가 CSS를 만든다.

`${blackHanSans.variable}` 같은 부분은 Tailwind 클래스를 `text-` + 변수로 조립하는 코드가 아니다. `next/font`가 넘기는 값은 폰트 CSS 변수를 붙이는 클래스 이름이고, 그 스타일은 `next/font`가 따로 넣는다. Tailwind 스캐너가 `h-full`을 변수에서 만들어 낼 필요가 없다.

그래서 “백틱을 쓰면 항상 인식이 안 된다”는 기억과는 다르다. 이 파일은 백틱을 쓰면서도 `h-full`, `antialiased`는 인식된다.

### 2.2 따옴표로 완성한 클래스

아래 파일들은 클래스 이름을 변수로 쪼개지 않고 문자열 그대로 적는다. 스캐너가 이름을 찾을 수 있다.

| 파일 | 소스에 적힌 완성된 클래스 |
| --- | --- |
| `app/layout.tsx`의 `body` | `min-h-full flex flex-col` |
| `component/templates/Header.tsx` | `container mx-auto flex flex-row justify-between items-center gap-10 px-4 py-8` |
| `component/molecules/DesktopNavigation.tsx` | `items-center gap-4 hidden md:flex` |
| `component/molecules/MobileNavigation.tsx` | `md:hidden`, `sr-only`, `w-6 h-6` |
| `app/(auth)/layout.tsx` | `bg-white text-black` |
| `component/molecules/BannerSwiperItem.tsx` | `text-red-500` |
| `component/atoms/CustomTitle.tsx` | `text-2xl font-bold text-center text-white` |
| `component/atoms/LogoImage.tsx` | `w-full h-full object-cover` |

`md:flex`처럼 접두사가 붙은 이름도 한 덩어리로 적혀 있으면 인식된다. `md:${something}`처럼 접두사 뒤를 변수로 두면 인식되지 않는다.

### 2.3 `cn`과 `twMerge`는 스캔을 대신하지 않는다

`lib/utils.ts`의 `cn`은 실행 중에 클래스 문자열을 합친다.

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`CustomTitle.tsx`와 `LogoImage.tsx`는 `twMerge("완성된 클래스", className)`를 호출한다. `twMerge`와 `clsx`는 이미 만들어진 문자열에서 겹치는 유틸리티를 고른다. Tailwind가 CSS를 생성하기 전에 소스에서 클래스 이름을 찾아 주는 도구가 아니다.

`BannerSwiperItem`이 `className="text-red-500"`를 넘기고, `CustomTitle`이 `text-white`와 합쳐 `text-red-500`를 남기는 동작은 두 문자열이 둘 다 소스에 완성된 형태로 있기 때문에 가능하다. `className={`text-${color}`}`를 넘기면 `twMerge`가 그 문자열을 만들어도, 빌드된 CSS에 그 유틸리티가 없으면 화면에는 적용되지 않는다.

이 저장소의 TSX에는 `text-${...}`나 `bg-${...}`처럼 클래스 이름을 조각으로 조립하는 코드는 없다.

## 3. 인식되는 경우와 안 되는 경우

| 작성 | 결과 | 이유 |
| --- | --- | --- |
| `` className={`h-full antialiased`} `` | 인식됨 | `h-full`, `antialiased`가 소스에 완성된 이름으로 있음. 이 프로젝트의 `layout.tsx`가 이 경우다 |
| `` className={`bg-${color}-600`} `` | 인식 안 됨 | `bg-red-600` 같은 완성된 이름이 소스에 없음. 공식 문서의 금지 예 |
| `` className={`${isOpen ? "block" : "hidden"}`} `` | 인식됨 | `"block"`과 `"hidden"`이 각각 완성된 문자열임 |
| `` className={`${colorVariants[color]}`} `` | 맵 안의 완성된 클래스만 인식됨 | 공식 문서가 권하는 방식. 맵에 없는 색은 CSS가 없음 |
| `className="text-red-500"` | 인식됨 | `BannerSwiperItem.tsx`처럼 따옴표 문자열로 전체가 적힘 |
| `twMerge("text-white", `text-${color}`)` | `text-${color}` 쪽은 인식 안 됨 | `twMerge`는 런타임 병합만 함 |

백틱 안에 글자와 변수를 붙여 클래스 이름을 만드는 경우만 기억이 가리키는 실패다. 백틱 자체가 감지를 끄지는 않는다.

## 4. 질문을 기준으로 한 답

테일윈드를 쓸 때 백틱 안에 글자와 변수를 조합하면 인식이 안 됐다는 기억은 맞다. Tailwind 4.3.3도 소스를 실행하지 않고 텍스트에서 완성된 클래스 이름만 찾는다. `bg-${color}-600`은 빌드 시점에 `bg-red-600`으로 계산되지 않는다.

같은 백틱이라도 `h-full antialiased`처럼 이름을 쪼개지 않으면 인식된다. `app/layout.tsx`가 그 예다. 값을 바꿔야 하면 변수로 이름 중간을 채우지 말고, 선택지마다 완성된 클래스 문자열을 소스에 적는다.

`cn`이나 `twMerge`를 써도 이 스캔 규칙은 바뀌지 않는다.

## 5. 공식 문서

- [Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- 같은 문서의 Dynamic class names, Safelisting classes 절. 꼭 필요한 클래스를 소스 밖에서 쓰려면 `@source inline("...")`으로 완성된 이름을 적는다.
- [tailwind-merge](https://github.com/dcastil/tailwind-merge). `cn`이 런타임에 호출하는 병합 라이브러리다.
- [Next.js Font Module](https://nextjs.org/docs/app/api-reference/components/font). `layout.tsx`의 `${blackHanSans.variable}`가 가리키는 폰트 클래스 설명이다.
