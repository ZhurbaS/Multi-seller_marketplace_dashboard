import { Pagination as UiPagination } from "../ui";

// Сумісна обгортка старого API (pageNumber, setPageNumber, totalItem, perPage, showItem) над UI-кітом.
const Pagination = ({ pageNumber, setPageNumber, totalItem, perPage, showItem }) => (
  <UiPagination
    page={pageNumber}
    total={totalItem}
    perPage={perPage}
    onChange={setPageNumber}
    siblingCount={Math.max(1, Math.floor((Number(showItem) || 3) / 2))}
  />
);

export default Pagination;
