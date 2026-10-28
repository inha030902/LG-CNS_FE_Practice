export default function CountBtn({ count, setCount }: { count: number | undefined, setCount: (count: number) => void }) {
    return (
        <button
            type="button"
            className="counter"
            onClick={() => setCount((count || 0) + 1)}
        >
            Count is {count}
        </button>
    )
}