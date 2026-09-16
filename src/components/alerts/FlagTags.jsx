function FlagTags({
  flags = []
}) {

  return (
    <div className="flex flex-wrap gap-2">

      {flags.map((flag) => (

        <span
          key={flag}
          className="
            px-2
            py-1
            rounded-md
            bg-gray-800
            border border-gray-700
            text-xs
            text-gray-300
          "
        >

          {String(flag)
            .replaceAll("_", " ")
            .replace(
              /\b\w/g,
              (letter) =>
                letter.toUpperCase()
            )}

        </span>

      ))}

    </div>
  );
}

export default FlagTags;