export function SurfaceAttributeGroup({ title, items = [] }: { title: string; items?: string[] }) {
  return (
    <article className="surface-attribute">
      <h3>{title}</h3>
      <ul>
        {(items.length ? items : ['待补充']).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
