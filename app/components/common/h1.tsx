type H1Props = {
  children: React.ReactNode;
  className?: string;
};

export default function H1({ children, className = "" }: H1Props) {
  return <h1 className={`text-4xl lg:text-5xl font-bold text-center ${className}`}>{children}</h1>;
}

