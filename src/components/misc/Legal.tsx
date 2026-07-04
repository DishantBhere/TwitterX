import { FaGithub } from "react-icons/fa";

export default function Legal() {
    return (
        <footer className="legal">
            <ul className="legal-links">
                <li>
                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                        Terms of Service
                    </a>
                </li>
                <li>
                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                        Privacy Policy
                    </a>
                </li>
                <li>
                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                        Cookie Policy
                    </a>
                </li>
                <li>
                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                        Imprint
                    </a>
                </li>
                <li>
                    <a href="https://github.com/DishantBhere/TwitterX" target="_blank">
                        Accessibility
                    </a>
                </li>
            </ul>
            <div className="copy">
                <a href="https://github.com/DishantBhere" target="_blank">
                    &copy; 2023 | Dishant Bhere
                </a>
                <a href="https://github.com/DishantBhere" target="_blank">
                    <FaGithub className="github" />
                </a>
            </div>
        </footer>
    );
}
