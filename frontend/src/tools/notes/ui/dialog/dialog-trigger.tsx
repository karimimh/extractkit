"use client";

import Button, { type ButtonProps } from "../button";

export type DialogTriggerProps = ButtonProps;

const DialogTrigger = (props: DialogTriggerProps) => {
  return <Button {...props} />;
};

export default DialogTrigger;
export type DialogTriggerComp = React.FC<DialogTriggerProps>;
