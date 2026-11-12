import Image from 'next/image';
export function Logo({small=false}:{small?:boolean}){return <Image src="/love6-logo.png" alt="LOVE6" width={small?95:125} height={small?32:40} priority className="h-auto w-auto"/>}
