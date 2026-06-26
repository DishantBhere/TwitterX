import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { BsSearch } from "react-icons/bs";

export default function Search() {
    const [searchQuery, setSearchQuery] = useState("");
    const { t } = useTranslation();

    const router = useRouter();

    const onSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const encodedSearchQuery = encodeURI(searchQuery);
        router.push(`/search?q=${encodedSearchQuery}`);
    };

    return (
        <form className="search" onSubmit={onSearch}>
            <input
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                required
            />
            <BsSearch />
        </form>
    );
}
