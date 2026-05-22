import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

const personalSeats = [1,2,3,4,5,6,7,8,9,10,11];
const pairSeats = [12,13,14,15,17,18,19,20,21,22,23,24];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function SeatSystem() {

  const ADMIN_PASSWORD = "asdf12!@";

  const [page, setPage] = useState("home");

  const [students, setStudents] = useState([]);
  const [loggedInStudent, setLoggedInStudent] = useState(null);

  const [studentCode, setStudentCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [newStudentName, setNewStudentName] = useState("");

  const [timeLimit, setTimeLimit] = useState(10);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);

  const [selectionClosed, setSelectionClosed] = useState(false);

  const [assignments, setAssignments] = useState({});
  const [downloadUrl, setDownloadUrl] = useState("");

  useEffect(() => {

    if (!timerStarted || selectionClosed) return;

    if (timeLeft <= 0) {
      generateAssignments();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [timeLeft, timerStarted, selectionClosed]);

  const generateCode = () => {
    return Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
  };

  const addStudent = () => {

    if (!newStudentName.trim()) return;

    setStudents((prev) => [
      ...prev,
      {
        name: newStudentName,
        code: generateCode(),
        wantsPartner: null,
        preferredPartner: "",
        avoidPartner: "",
        choices: [],
        submitted: false
      }
    ]);

    setNewStudentName("");
  };

  const loginStudent = () => {

    const student = students.find(
      (s) => s.code === studentCode
    );

    if (!student) {
      alert("잘못된 접속 코드입니다.");
      return;
    }

    if (student.submitted) {
      alert("이미 희망 조사를 완료했습니다.");
      return;
    }

    if (selectionClosed) {
      alert("희망 조사가 종료되었습니다.");
      return;
    }

    setLoggedInStudent(student);
    setPage("student");
  };

  const adminLogin = () => {

    if (adminPassword !== ADMIN_PASSWORD) {
      alert("비밀번호가 틀렸습니다.");
      return;
    }

    setPage("admin");
  };

  const updateStudent = (field, value) => {

    setStudents((prev) =>
      prev.map((student) => {

        if (student.code !== loggedInStudent.code) {
          return student;
        }

        const updated = {
          ...student,
          [field]: value
        };

        setLoggedInStudent(updated);

        return updated;
      })
    );
  };

  const toggleChoice = (seat) => {

    setStudents((prev) =>
      prev.map((student) => {

        if (student.code !== loggedInStudent.code) {
          return student;
        }

        let updatedChoices = [...student.choices];

        if (updatedChoices.includes(seat)) {

          updatedChoices = updatedChoices.filter(
            (s) => s !== seat
          );

        } else {

          if (updatedChoices.length >= 5) {
            alert("최대 5지망까지 선택 가능합니다.");
            return student;
          }

          updatedChoices.push(seat);
        }

        const updated = {
          ...student,
          choices: updatedChoices
        };

        setLoggedInStudent(updated);

        return updated;
      })
    );
  };

  const startTimer = () => {

    if (timerStarted) return;

    setTimerStarted(true);
    setTimeLeft(timeLimit * 60);
  };

  const submitSelection = () => {

    setStudents((prev) => {

      const updated = prev.map((student) => {

        if (student.code !== loggedInStudent.code) {
          return student;
        }

        return {
          ...student,
          submitted: true
        };
      });

      const everyoneSubmitted =
        updated.length > 0 &&
        updated.every((s) => s.submitted);

      if (everyoneSubmitted) {
        generateAssignments(updated);
      }

      return updated;
    });

    alert("희망 조사가 완료되었습니다.");

    setPage("home");
  };

  const generateAssignments = (customStudents = students) => {

    if (selectionClosed) return;

    const result = {};
    const usedSeats = new Set();

    const shuffledStudents = shuffle(customStudents);

    const partnerStudents = shuffledStudents.filter(
      (s) => s.wantsPartner === true
    );

    const singleStudents = shuffledStudents.filter(
      (s) => s.wantsPartner === false
    );

    const paired = new Set();

    const pairSeatStarts = [12, 14, 17, 19, 21, 23];

    const assignPairSeat = (nameText) => {

      const availableSeat = pairSeatStarts.find(
        (seat) =>
          !usedSeats.has(seat) &&
          !usedSeats.has(seat + 1)
      );

      if (!availableSeat) return;

      result[availableSeat] = {
        name: nameText
      };

      usedSeats.add(availableSeat);
      usedSeats.add(availableSeat + 1);
    };

    for (const student of partnerStudents) {

      if (paired.has(student.name)) continue;

      let partner = partnerStudents.find(
        (s) =>
          s.name === student.preferredPartner &&
          !paired.has(s.name) &&
          s.name !== student.name &&
          !(s.avoidPartner === student.name && student.avoidPartner === s.name)
      );

      if (!partner) {

        partner = partnerStudents.find(
          (s) =>
            !paired.has(s.name) &&
            s.name !== student.name &&
            !(s.avoidPartner === student.name && student.avoidPartner === s.name)
        );
      }

      if (partner) {

        assignPairSeat(`${student.name} · ${partner.name}`);

        paired.add(student.name);
        paired.add(partner.name);
      }
    }

    const remainingStudents = partnerStudents.filter(
      (s) => !paired.has(s.name)
    );

    while (remainingStudents.length >= 2) {

      const first = remainingStudents.shift();

      const partnerIndex = remainingStudents.findIndex(
        (s) =>
          !(s.avoidPartner === first.name && first.avoidPartner === s.name)
      );

      if (partnerIndex === -1) {
        continue;
      }

      const second = remainingStudents.splice(partnerIndex, 1)[0];

      assignPairSeat(`${first.name} · ${second.name}`);

      paired.add(first.name);
      paired.add(second.name);
    }

    singleStudents.forEach((student) => {

      const availableSeats = personalSeats.filter(
        (seat) => !usedSeats.has(seat)
      );

      const preferredSeat = student.choices.find(
        (seat) => availableSeats.includes(seat)
      );

      const finalSeat = preferredSeat || availableSeats[0];

      if (!finalSeat) return;

      result[finalSeat] = student;

      usedSeats.add(finalSeat);
    });

    setAssignments(result);
    setSelectionClosed(true);

    createSeatImage(result);
  };

  const createSeatImage = (result) => {

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("1-1 자리 배치표", 40, 60);

    ctx.fillStyle = "#d1fae5";
    ctx.fillRect(420, 100, 360, 60);

    ctx.fillStyle = "black";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText("칠판", 555, 140);

    const allSeats = [...personalSeats, ...pairSeats];

    allSeats.forEach((seat, index) => {

      const row = Math.floor(index / 6);
      const col = index % 6;

      const x = 70 + col * 210;
      const y = 220 + row * 120;

      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(x, y, 160, 80);

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, 160, 80);

      ctx.fillStyle = "black";
      ctx.font = "bold 18px sans-serif";
      const pairLeftSeats = [12,14,17,19,21,23];

      const hiddenPairSeats = [13,15,18,20,22,24];

      if (hiddenPairSeats.includes(seat)) {
        return;
      }

      const width = pairLeftSeats.includes(seat)
        ? 330
        : 160;

      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(x, y, width, 80);

      ctx.strokeStyle = "black";
      ctx.strokeRect(x, y, width, 80);

      ctx.fillStyle = "black";
      ctx.font = "bold 18px sans-serif";

      ctx.fillText(
        pairLeftSeats.includes(seat)
          ? `${seat}-${seat + 1}번`
          : `${seat}번`,
        x + 10,
        y + 25
      );

      if (result[seat]) {
        ctx.font = "16px sans-serif";
        ctx.fillText(result[seat].name, x + 10, y + 55);
      }
    });

    setDownloadUrl(canvas.toDataURL("image/png"));
  };

  const renderSeat = (seat) => {

    const student = assignments[seat];

    const isPairSeat = pairSeats.includes(seat);

    const pairLeftSeats = [12,14,17,19,21,23];

    const shouldSpan = isPairSeat && pairLeftSeats.includes(seat);

    const hiddenPairSeats = [13,15,18,20,22,24];

    if (hiddenPairSeats.includes(seat)) {
      return null;
    }

    return (
      <div
        key={seat}
        className={`rounded-2xl border-2 bg-white p-4 min-h-[110px] flex flex-col items-center justify-center ${
          shouldSpan ? "col-span-2" : ""
        }`}
      >

        <div className="font-bold text-lg">
          {shouldSpan
            ? `${seat}-${seat + 1}번`
            : `${seat}번`}
        </div>

        {student && (
          <div className="mt-2 font-semibold text-center">
            {student.name}
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-4xl font-bold">
            1-1 자리 선택 시스템
          </h1>

          <p className="text-gray-600 mt-2">
            희망 조사를 완료하면 다시 접속할 수 없습니다.
          </p>
        </div>

        {page === "home" && (

          <div className="grid lg:grid-cols-2 gap-6">

            <Card className="rounded-3xl shadow-xl">
              <CardContent className="p-8 space-y-5">

                <h2 className="text-3xl font-bold">
                  학생 접속
                </h2>

                <input
                  value={studentCode}
                  onChange={(e) =>
                    setStudentCode(e.target.value.toUpperCase())
                  }
                  placeholder="접속 코드 입력"
                  className="w-full rounded-2xl border p-4"
                />

                <Button
                  className="w-full py-6 rounded-2xl"
                  onClick={loginStudent}
                >
                  접속하기
                </Button>

              </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-xl">
              <CardContent className="p-8 space-y-5">

                <h2 className="text-3xl font-bold">
                  관리자 로그인
                </h2>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(e.target.value)
                  }
                  placeholder="관리자 비밀번호"
                  className="w-full rounded-2xl border p-4"
                />

                <Button
                  className="w-full py-6 rounded-2xl"
                  onClick={adminLogin}
                >
                  관리자 페이지 이동
                </Button>

              </CardContent>
            </Card>

          </div>
        )}

        {page === "admin" && (

          <div className="space-y-6">

            <Card className="rounded-3xl shadow-xl">
              <CardContent className="p-6 space-y-5">

                <div className="flex justify-between items-center flex-wrap gap-4">

                  <div className="flex items-center gap-3">

                    <h2 className="text-3xl font-bold">
                      관리자 페이지
                    </h2>

                    <button
                      onClick={() => setPage("home")}
                      className="rounded-2xl px-4 py-2 bg-gray-200"
                    >
                      홈으로
                    </button>

                  </div>

                  <div className="flex gap-3">

                    <input
                      type="number"
                      min="1"
                      value={timeLimit}
                      onChange={(e) =>
                        setTimeLimit(Number(e.target.value))
                      }
                      className="w-28 rounded-2xl border p-3"
                    />

                    <Button onClick={startTimer}>
                      타이머 시작
                    </Button>

                  </div>

                </div>

                <div className="rounded-2xl bg-gray-100 p-4 text-center font-bold">
                  {timerStarted
                    ? `남은 시간: ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
                    : `설정 시간: ${timeLimit}분`}
                </div>

                <div className="flex gap-3">

                  <input
                    value={newStudentName}
                    onChange={(e) =>
                      setNewStudentName(e.target.value)
                    }
                    placeholder="학생 이름 입력"
                    className="flex-1 rounded-2xl border p-4"
                  />

                  <Button onClick={addStudent}>
                    학생 추가
                  </Button>

                </div>

              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">

              {students.map((student) => (

                <Card
                  key={student.code}
                  className="rounded-3xl shadow-lg"
                >

                  <CardContent className="p-6 space-y-4">

                    <div className="text-2xl font-bold">
                      {student.name}
                    </div>

                    <div className="text-2xl font-mono text-blue-600">
                      {student.code}
                    </div>

                    <div className={`font-bold ${
                      student.submitted
                        ? "text-green-600"
                        : "text-red-500"
                    }`}>
                      {student.submitted
                        ? "제출 완료"
                        : "미제출"}
                    </div>

                    {student.wantsPartner === true && (
                      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 space-y-2">

                        <div className="font-bold text-blue-700">
                          짝꿍 희망
                        </div>

                        <div>
                          희망 학생:
                          {student.preferredPartner || "없음"}
                        </div>

                        <div>
                          비희망 학생:
                          {student.avoidPartner || "없음"}
                        </div>

                      </div>
                    )}

                    {student.wantsPartner === false && (
                      <div className="rounded-2xl bg-green-50 border border-green-200 p-4 space-y-2">

                        <div className="font-bold text-green-700">
                          개인 자리 희망
                        </div>

                        <div className="flex flex-wrap gap-2">

                          {student.choices.length > 0
                            ? student.choices.map((seat, index) => (
                                <div
                                  key={seat}
                                  className="rounded-xl bg-white border px-3 py-2 text-sm font-semibold"
                                >
                                  {index + 1}지망 · {seat}번
                                </div>
                              ))
                            : "선택 안 함"}

                        </div>

                      </div>
                    )}

                  </CardContent>

                </Card>

              ))}

            </div>

            {selectionClosed && (

              <Card className="rounded-3xl shadow-xl">
                <CardContent className="p-6 space-y-6">

                  <h2 className="text-3xl font-bold">
                    최종 자리 결과
                  </h2>

                  <div className="rounded-2xl bg-green-100 border border-green-300 p-4 text-center font-bold text-green-800">
                    ↑ 칠판 ↑
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    {[...personalSeats, ...pairSeats].map(renderSeat)}
                  </div>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download="자리배치표.png"
                      className="inline-block rounded-2xl bg-blue-500 text-white px-6 py-4 font-semibold"
                    >
                      자리 배치표 다운로드
                    </a>
                  )}

                </CardContent>
              </Card>
            )}

          </div>
        )}

        {page === "student" && loggedInStudent && (

          <Card className="rounded-3xl shadow-xl">
            <CardContent className="p-6 space-y-6">

              <h2 className="text-3xl font-bold">
                {loggedInStudent.name}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">

                <button
                  type="button"
                  onClick={() =>
                    updateStudent("wantsPartner", true)
                  }
                  className={`rounded-2xl p-5 border-2 font-semibold ${
                    loggedInStudent.wantsPartner === true
                      ? "bg-blue-500 text-white"
                      : "bg-white"
                  }`}
                >
                  짝꿍 희망
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateStudent("wantsPartner", false)
                  }
                  className={`rounded-2xl p-5 border-2 font-semibold ${
                    loggedInStudent.wantsPartner === false
                      ? "bg-red-500 text-white"
                      : "bg-white"
                  }`}
                >
                  개인 자리 희망
                </button>

              </div>

              {loggedInStudent.wantsPartner === true && (

                <div className="grid md:grid-cols-2 gap-4">

                  <select
                    value={loggedInStudent.preferredPartner}
                    onChange={(e) =>
                      updateStudent(
                        "preferredPartner",
                        e.target.value
                      )
                    }
                    className="rounded-2xl border p-4"
                  >

                    <option value="">
                      희망 짝꿍 선택
                    </option>

                    {students
                      .filter(
                        (s) =>
                          s.name !== loggedInStudent.name
                      )
                      .map((s) => (

                        <option
                          key={s.code}
                          value={s.name}
                        >
                          {s.name}
                        </option>

                      ))}

                  </select>

                  <select
                    value={loggedInStudent.avoidPartner}
                    onChange={(e) =>
                      updateStudent(
                        "avoidPartner",
                        e.target.value
                      )
                    }
                    className="rounded-2xl border p-4"
                  >

                    <option value="">
                      비희망 짝꿍 선택
                    </option>

                    {students
                      .filter(
                        (s) =>
                          s.name !== loggedInStudent.name
                      )
                      .map((s) => (

                        <option
                          key={s.code}
                          value={s.name}
                        >
                          {s.name}
                        </option>

                      ))}

                  </select>

                </div>
              )}

              {loggedInStudent.wantsPartner === false && (

                <div className="space-y-5">

                  <div className="rounded-2xl bg-green-100 border border-green-300 p-4 text-center font-bold text-green-800">
                    ↑ 칠판은 이 방향입니다 ↑
                  </div>

                  <div className="grid grid-cols-5 gap-3">

                    {personalSeats.map((seat) => {

                      const selectedIndex =
                        loggedInStudent.choices.indexOf(seat);

                      const selected = selectedIndex !== -1;

                      return (

                        <button
                          key={seat}
                          type="button"
                          onClick={() => toggleChoice(seat)}
                          className={`rounded-2xl p-4 border-2 font-semibold ${
                            selected
                              ? "bg-blue-500 text-white"
                              : "bg-white"
                          }`}
                        >

                          {selected
                            ? `${selectedIndex + 1}지망`
                            : `${seat}번`}

                        </button>
                      );
                    })}

                  </div>

                </div>
              )}

              <Button
                className="rounded-2xl py-5"
                onClick={submitSelection}
              >
                제출하기
              </Button>

            </CardContent>
          </Card>
        )}

      </div>

    </div>
  );
}
