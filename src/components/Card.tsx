interface Props {
  children: React.ReactNode;
  className: string;
}

const Card = (props: Props) => {
  return (
    <div className={`p-5 ${props.className} rounded-md`}>
      {props.children}
    </div>
  )
}

export default Card;
