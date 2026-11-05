import { FilterBar, Select } from "../../ui";

const PER_PAGE = [
  { value: 5, label: "5 на сторінці" },
  { value: 10, label: "10 на сторінці" },
  { value: 20, label: "20 на сторінці" },
];

// Сумісна обгортка (setPerPage, setSearchValue, searchValue) над FilterBar UI-кіта.
const Search = ({ setPerPage, setSearchValue, searchValue, perPage }) => (
  <FilterBar search={{ value: searchValue, onChange: setSearchValue, placeholder: "Пошук" }} className="mb-0">
    <Select
      aria-label="Кількість на сторінці"
      size="sm"
      options={PER_PAGE}
      value={perPage}
      defaultValue={perPage === undefined ? 5 : undefined}
      onChange={(e) => setPerPage(parseInt(e.target.value))}
    />
  </FilterBar>
);

export default Search;
