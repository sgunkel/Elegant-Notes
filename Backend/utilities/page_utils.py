
def rename_page_references_in_str(old_page_name: str, new_page_name: str, content: str) -> str:
    # TODO make this more efficient - re.compile might be worth looking into...
    to_find = f'[[{old_page_name}]]'
    to_replace = f'[[{new_page_name}]]'
    return content.replace(to_find, to_replace)
