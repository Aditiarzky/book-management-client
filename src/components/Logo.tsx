import { Link } from "@tanstack/react-router";

export const MainLogo = ({ type }:{type:number}) => {
    if (type == 1) {
        return (
            <Link to="/">
                <h1
                    title="Riztranslation"
                    className="cursor-pointer font-breeSerif text-green-700 text-2xl"
                >
                <div className="logo-img-2 h-12 w-28"></div>
                </h1>
            </Link>
        );
    } else {
        return (
            <Link to="/">
                <div className="logo-img h-12 w-28"></div>
            </Link>
        );
    }
};
